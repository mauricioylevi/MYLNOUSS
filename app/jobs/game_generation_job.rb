class GameGenerationJob < ApplicationJob
  queue_as :default

  def perform(main_user_id, game_type, difficulty = nil)
    user = MainUser.find_by(id: main_user_id)
    
    # Optional requirement for main_user depending on how GameCache is validated
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

    payload = nil

    case game_type
    when 'crossword'
      difficulty ||= 'easy'
      data = GeminiService.generate_crossword_data(difficulty, profile_info)
      payload = { 'words' => data } if data.any?
    when 'missing_word'
      data = GeminiService.generate_missing_word_data(profile_info)
      payload = { 'game_data' => data } if data
    when 'photo_memory'
      photos = Photo.where.not(status: 'draft').joins(:image_attachment).order("RANDOM()").limit(5)
      if photos.count >= 5
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
                # We can't generate fully qualified URLs easily in Jobs without request context.
                # So we just pass the photo ID, and the controller will map it to url_for(photo.image).
                results[index] = {
                  'photo_id' => photo.id,
                  'question' => question_data['question'],
                  'choices' => question_data['choices'],
                  'answer' => question_data['answer']
                }
              end
            end
          end
        end
        threads.each(&:join)
        valid_rounds = results.compact
        if valid_rounds.length == 5
          payload = { 'rounds' => valid_rounds }
        end
      end
    when 'career_quiz'
      career_info = "Unknown Career"
      life_info = "Unknown Life Details"
      if user && user.profile_data.present?
        career_parts = [
          user.profile_data.dig('inputs', 'prof_career'), 
          user.profile_data.dig('inputs', 'prof_experience')
        ].compact.reject(&:blank?)
        career_info = career_parts.join(" - ") if career_parts.any?
        
        life_desc = user.profile_data.dig('inputs', 'prof_life_desc')
        life_info = life_desc if life_desc.present?
      end
      data = GeminiService.generate_career_quiz_data(career_info, life_info)
      payload = { 'rounds' => data } if data
    when 'word_search'
      difficulty ||= 'easy'
      data = GeminiService.generate_word_search_data(difficulty, profile_info)
      payload = { 'words' => data } if data && data.any?
    when 'photo_trivia'
      # Find photos that have a description, order random, take up to 3
      photos = Photo.where.not(description: [nil, '']).order("RANDOM()").limit(3)
      if photos.any?
        threads = []
        results = Array.new(photos.count)
        photos.each_with_index do |photo, index|
          threads << Thread.new do
            options = GeminiService.generate_photo_trivia_fakes(photo.description)
            results[index] = {
              'photo_id' => photo.id,
              'correct' => photo.description,
              'options' => options
            }
          end
        end
        threads.each(&:join)
        payload = { 'rounds' => results.compact }
      end
    when 'critical_thinking'
      difficulty ||= 'easy'
      rounds = GeminiService.generate_critical_thinking_data(difficulty, profile_info)
      payload = { 'rounds' => rounds } if rounds && rounds.any?
    when 'lets_talk'
      prompts = GeminiService.generate_lets_talk_prompts(profile_info)
      payload = { 'prompts' => prompts } if prompts && prompts.any?
    end

    if payload
      # Find or initialize to avoid duplicates in the cache queue
      cache = GameCache.find_or_initialize_by(
        main_user_id: main_user_id,
        game_type: game_type,
        difficulty: difficulty
      )
      cache.payload = payload
      cache.save!
    end
  end
end
