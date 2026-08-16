class GamesController < ApplicationController
  def profile_quiz
    # Fallbacks in case the user hasn't filled out a profile yet
    hobbies = ['travel', 'cooking', 'reading', 'photography']
    
    if MainUser.first && MainUser.first.profile_data
      user_hobbies = MainUser.first.profile_data['hobbies']
      hobbies = user_hobbies if user_hobbies.present? && user_hobbies.is_a?(Array)
    end
    
    unless ENV['GEMINI_API_KEY'].present?
      render json: { success: false, error: "Missing Gemini API Key in server configuration." }, status: 500
      return
    end

    # Generate the JSON quiz structure
    quiz_data = GeminiService.generate_quiz_data(hobbies)
    
    if quiz_data.empty?
      render json: { success: false, error: "Failed to generate quiz data." }, status: 500
      return
    end
    
    # Concurrently generate images for all 5 rounds to keep it fast (~3 seconds total)
    threads = []
    
    quiz_data.each do |round|
      threads << Thread.new do
        base64_image = GeminiService.generate_image(round['subject'])
        round['image_base64'] = base64_image
      end
    end
    
    threads.each(&:join)
    
    # Filter out any rounds that failed to generate an image
    valid_rounds = quiz_data.select { |r| r['image_base64'].present? }
    
    if valid_rounds.any?
      render json: { success: true, rounds: valid_rounds }
    else
      render json: { success: false, error: "Failed to generate images." }, status: 500
    end
  end

  def career_quiz
    @user = MainUser.first || MainUser.create

    cache = GameCache.find_by(main_user_id: @user.id, game_type: 'career_quiz')
    if cache && cache.payload.present?
      @career_data = cache.payload['rounds']
      cache.destroy
      GameGenerationJob.perform_later(@user.id, 'career_quiz')
    else
      @career_data = nil
      GameGenerationJob.perform_later(@user.id, 'career_quiz')
    end
  end

  def word_search
    @user = MainUser.first || MainUser.create
    @difficulty = params[:difficulty] || 'easy'
    
    cache = GameCache.find_by(main_user_id: @user.id, game_type: 'word_search', difficulty: @difficulty)
    
    if cache && cache.payload.present?
      @words = cache.payload['words']
      cache.destroy
      GameGenerationJob.perform_later(@user.id, 'word_search', @difficulty)
    else
      # If no cache for this difficulty, trigger job and serve nil so UI shows "Generating..."
      @words = nil
      GameGenerationJob.perform_later(@user.id, 'word_search', @difficulty)
    end
  end

  def photo_memory
    user = MainUser.first
    user_id = user&.id

    cache = GameCache.where(main_user_id: user_id, game_type: 'photo_memory').first
    if cache
      payload = cache.payload
      cache.destroy
      GameGenerationJob.perform_later(user_id, 'photo_memory')
      
      if payload['rounds']
        payload['rounds'].each do |round|
          photo = Photo.find_by(id: round['photo_id'])
          round['image_url'] = photo ? url_for(photo.image) : nil
        end
      end
      
      render json: { success: true, rounds: payload['rounds'] }
      return
    end

    unless ENV['GEMINI_API_KEY'].present?
      render json: { success: false, error: "Missing Gemini API Key." }, status: 500
      return
    end

    photos = Photo.where.not(status: 'draft').joins(:image_attachment).order("RANDOM()").limit(5)
    
    if photos.count < 5
      render json: { success: false, error: "Not enough photos in gallery. Please upload at least 5 photos first!" }, status: 400
      return
    end

    threads = []
    results = Array.new(5)

    photos.each_with_index do |photo, index|
      threads << Thread.new do
        if photo.image.attached?
          image_data = photo.image.download
          base64_image = Base64.strict_encode64(image_data)
          mime_type = photo.image.content_type || "image/jpeg"
          
          question_data = GeminiService.generate_memory_question(base64_image, mime_type)
          
          if question_data
            image_url = url_for(photo.image)
            results[index] = {
              image_url: image_url,
              question: question_data['question'],
              choices: question_data['choices'],
              answer: question_data['answer']
            }
          end
        end
      end
    end

    threads.each(&:join)
    valid_rounds = results.compact

    GameGenerationJob.perform_later(user_id, 'photo_memory')

    if valid_rounds.length == 5
      render json: { success: true, rounds: valid_rounds }
    else
      render json: { success: false, error: "Failed to generate questions for all photos." }, status: 500
    end
  end

  def cards_match
    difficulty = params[:difficulty] || 'easy'
    pairs_needed = case difficulty
                   when 'hard' then 8
                   when 'medium' then 6
                   else 4
                   end

    photos = Photo.where.not(status: 'draft').joins(:image_attachment).order("RANDOM()").limit(pairs_needed).to_a
    
    image_urls = photos.map { |p| url_for(p.image) }
    
    shortfall = pairs_needed - photos.count
    
    if shortfall > 0
      fallback_subjects = [
        "A cute golden retriever puppy playing in the grass",
        "A serene sunset over a calm ocean beach",
        "A colorful hot air balloon in a clear blue sky",
        "A delicious stack of pancakes with maple syrup",
        "A majestic lion resting in the savanna",
        "A blooming pink cherry blossom tree",
        "A classic red sports car on a coastal road",
        "A snowy mountain peak under a starry night sky"
      ].sample(shortfall)
      
      threads = []
      ai_images = Array.new(shortfall)
      
      fallback_subjects.each_with_index do |subject, index|
        threads << Thread.new do
          begin
            ai_images[index] = GeminiService.generate_image(subject)
          rescue => e
            Rails.logger.error "CardsMatch AI Fallback Error: #{e.message}"
          end
        end
      end
      
      threads.each(&:join)
      
      # For any AI generation failures, we will use a reliable static external placeholder to prevent crashes
      ai_images.each_with_index do |base64_data, i|
        if base64_data
          image_urls << "data:image/jpeg;base64,#{base64_data}"
        else
          image_urls << "https://picsum.photos/seed/#{SecureRandom.hex(4)}/400/400"
        end
      end
    end
    
    # We need pairs of each image
    deck = (image_urls + image_urls).shuffle
    
    render json: { success: true, deck: deck }
  end

  def crossword
    respond_to do |format|
      format.html do
        render :crossword
      end
      format.json do
        difficulty = params[:difficulty] || 'easy'
        user = MainUser.first
        user_id = user&.id
        
        cache = GameCache.where(main_user_id: user_id, game_type: 'crossword', difficulty: difficulty).first
        if cache
          payload = cache.payload
          cache.destroy
          GameGenerationJob.perform_later(user_id, 'crossword', difficulty)
          render json: { success: true, words: payload['words'] }
          return
        end
        
        unless ENV['GEMINI_API_KEY'].present?
          render json: { success: false, error: "Missing Gemini API Key." }, status: 500
          return
        end

        profile_info = "General Knowledge"
        if user && user.profile_data.present?
          parts = []
          user.profile_data.each do |key, value|
            next if value.blank?
            val_str = value.is_a?(Array) ? value.join(', ') : value.to_s
            parts << "#{key.to_s.titleize}: #{val_str}"
          end
          profile_info = parts.join(" | ") if parts.any?
        end

        words_data = GeminiService.generate_crossword_data(difficulty, profile_info)
        GameGenerationJob.perform_later(user_id, 'crossword', difficulty)
        
        if words_data.any?
          render json: { success: true, words: words_data }
        else
          render json: { success: false, error: "Failed to generate crossword data." }, status: 500
        end
      end
    end
  end

  def gallery
  end

  def missing_word
    respond_to do |format|
      format.html do
        render :missing_word
      end
      format.json do
        user = MainUser.first
        user_id = user&.id

        cache = GameCache.where(main_user_id: user_id, game_type: 'missing_word').first
        if cache
          payload = cache.payload
          cache.destroy
          GameGenerationJob.perform_later(user_id, 'missing_word')
          render json: { success: true, game_data: payload['game_data'] }
          return
        end

        profile_info = "General Knowledge"
        if user && user.profile_data.present?
          parts = []
          user.profile_data.each do |key, value|
            next if value.blank?
            val_str = value.is_a?(Array) ? value.join(', ') : value.to_s
            parts << "#{key.to_s.titleize}: #{val_str}"
          end
          profile_info = parts.join(" | ") if parts.any?
        end

        data = GeminiService.generate_missing_word_data(profile_info)
        GameGenerationJob.perform_later(user_id, 'missing_word')

        if data
          render json: { success: true, game_data: data }
        else
          render json: { success: false, error: "Failed to generate missing word data." }, status: 500
        end
      end
    end
  end

  def tic_tac_toe
  end

  def create_a_story
    @user = MainUser.first || MainUser.create
  end

  def photo_trivia
    @user = MainUser.first || MainUser.create
    cache = GameCache.find_by(main_user_id: @user.id, game_type: 'photo_trivia')
    
    @game_data = nil
    if cache && cache.payload && cache.payload['rounds']
      rounds = cache.payload['rounds'].map do |r|
        photo = Photo.find_by(id: r['photo_id'])
        if photo && photo.image.attached?
          r.merge('image_url' => url_for(photo.image))
        else
          nil
        end
      end.compact
      
      @game_data = { 'rounds' => rounds } if rounds.any?
    end
  end

  def critical_thinking
    @user = MainUser.first || MainUser.create
    @difficulty = params[:difficulty] || 'easy'
    
    # Try cache first
    cache = GameCache.find_by(main_user_id: @user.id, game_type: 'critical_thinking', difficulty: @difficulty)
    @game_data = cache&.payload
  end

  def lets_talk
    @user = MainUser.first || MainUser.create
    cache = GameCache.find_by(main_user_id: @user.id, game_type: 'lets_talk')
    @game_data = cache&.payload

    # Enqueue a background job to overwrite the cache for next time,
    # so that the topics are different every time the user plays the game.
    GameGenerationJob.perform_later(@user.id, 'lets_talk')
  end

  def generate_critical_thinking
    @user = MainUser.first || MainUser.create
    difficulty = params[:difficulty] || 'easy'
    
    # Optional profile context
    profile_info = "General Knowledge"
    if @user && @user.profile_data.present?
      parts = []
      @user.profile_data.each do |k, v|
        next if v.blank?
        val_str = v.is_a?(Array) ? v.join(', ') : v.to_s
        parts << "#{k.to_s.titleize}: #{val_str}"
      end
      profile_info = parts.join(" | ") if parts.any?
    end
    
    rounds = GeminiService.generate_critical_thinking_data(difficulty, profile_info)
    
    if rounds && rounds.any?
      # Cache it for later
      cache = GameCache.find_or_initialize_by(main_user_id: @user.id, game_type: 'critical_thinking', difficulty: difficulty)
      cache.payload = { 'rounds' => rounds }
      cache.save
      
      render json: { success: true, rounds: rounds }
    else
      render json: { success: false }, status: :unprocessable_entity
    end
  end

  def generate_lets_talk
    @user = MainUser.first || MainUser.create
    
    profile_info = "General Knowledge"
    if @user && @user.profile_data.present?
      parts = []
      @user.profile_data.each do |k, v|
        next if v.blank?
        val_str = v.is_a?(Array) ? v.join(', ') : v.to_s
        parts << "#{k.to_s.titleize}: #{val_str}"
      end
      profile_info = parts.join(" | ") if parts.any?
    end
    
    prompts = GeminiService.generate_lets_talk_prompts(profile_info)
    
    if prompts && prompts.any?
      # Update cache
      cache = GameCache.find_or_initialize_by(main_user_id: @user.id, game_type: 'lets_talk')
      cache.payload = { 'prompts' => prompts }
      cache.save
      
      render json: { success: true, prompts: prompts }
    else
      render json: { success: false }, status: :unprocessable_entity
    end
  end

  def story_prompts
    prompts = GeminiService.generate_story_prompts
    render json: { prompts: prompts }
  end

  def story_ai_turn
    history = params[:history] || []
    sentence = GeminiService.generate_story_continuation(history)
    render json: { sentence: sentence }
  end
end
