require 'net/http'
require 'uri'
require 'json'

class GeminiService
  def self.generate_quiz_data(hobbies)
    api_key = ENV['GEMINI_API_KEY']
    return [] unless api_key.present?
    
    uri = URI("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=#{api_key}")
    
    prompt = <<~PROMPT
      You are generating data for a multiple-choice picture guessing game.
      The user's hobbies are: #{hobbies.join(', ')}.
      Generate exactly 5 distinct visual subjects related to these hobbies.
      For each subject, provide 3 multiple choice options (1 correct, 2 incorrect but plausible).
      Return ONLY a JSON array of 5 objects in this format, with no markdown formatting:
      [
        { "subject": "a vintage 35mm film camera", "choices": ["Vintage Camera", "Binoculars", "Microscope"], "answer": "Vintage Camera" }
      ]
    PROMPT
    
    req = Net::HTTP::Post.new(uri)
    req['Content-Type'] = 'application/json'
    req.body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7 }
    }.to_json
    
    res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
      http.request(req)
    end
    
    if res.is_a?(Net::HTTPSuccess)
      data = JSON.parse(res.body)
      text = data.dig('candidates', 0, 'content', 'parts', 0, 'text') || '[]'
      # Clean potential markdown
      text = text.gsub("```json", "").gsub("```", "").strip
      begin
        JSON.parse(text)
      rescue
        []
      end
    else
      Rails.logger.error "Gemini Text Error: #{res.body}"
      []
    end
  end

  def self.generate_image(subject)
    api_key = ENV['GEMINI_API_KEY']
    return nil unless api_key.present?
    
    uri = URI("https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=#{api_key}")
    
    req = Net::HTTP::Post.new(uri)
    req['Content-Type'] = 'application/json'
    req.body = {
      instances: [{ prompt: "A highly detailed, beautiful, premium photograph of #{subject}" }],
      parameters: {
        sampleCount: 1,
        outputOptions: { mimeType: "image/jpeg" }
      }
    }.to_json
    
    res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true, read_timeout: 30) do |http|
      http.request(req)
    end
    
    if res.is_a?(Net::HTTPSuccess)
      data = JSON.parse(res.body)
      data.dig('predictions', 0, 'bytesBase64Encoded')
    else
      Rails.logger.error "Gemini Image Error: #{res.body}"
      nil
    end
  end

  def self.generate_memory_question(base64_image, mime_type = "image/jpeg")
    api_key = ENV['GEMINI_API_KEY']
    return nil unless api_key.present?
    
    # We use gemini-3.5-flash for vision tasks as well
    uri = URI("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=#{api_key}")
    
    prompt = <<~PROMPT
      You are generating data for a "Photo Memory" multiple-choice quiz.
      Look at the provided image and generate exactly ONE question to identify a LARGE, OBVIOUS object, color, or person.
      DO NOT ask about tiny, blurry, or difficult to distinguish background details.
      Produce exactly 3 choices (1 correct, 2 incorrect).
      Return ONLY a JSON object in this format, with no markdown formatting:
      { "question": "What color is the car?", "choices": ["Red", "Blue", "Black"], "answer": "Red" }
    PROMPT
    
    req = Net::HTTP::Post.new(uri)
    req['Content-Type'] = 'application/json'
    req.body = {
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: mime_type, data: base64_image } }
        ]
      }],
      generationConfig: { temperature: 0.7 }
    }.to_json
    
    res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
      http.read_timeout = 120
      http.request(req)
    end
    
    if res.is_a?(Net::HTTPSuccess)
      data = JSON.parse(res.body)
      text = data.dig('candidates', 0, 'content', 'parts', 0, 'text') || '{}'
      text = text.gsub("```json", "").gsub("```", "").strip
      begin
        JSON.parse(text)
      rescue
        nil
      end
    else
      Rails.logger.error "Gemini Vision Error: #{res.body}"
      nil
    end
  end

  def self.generate_crossword_data(difficulty, profile_info = "General Knowledge")
    api_key = ENV['GEMINI_API_KEY']
    return [] unless api_key.present?
    
    uri = URI("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=#{api_key}")
    
    word_count, complexity_desc, clue_style = case difficulty
                                              when 'hard' then [12, "8 to 12 letter words, obscure or highly challenging vocabulary", "Provide clever, tricky, and misdirecting puns typical of the hardest newspaper crosswords."]
                                              when 'medium' then [8, "6 to 8 letter words, moderately difficult vocabulary", "Provide standard trivia or general knowledge clues, moderately challenging but not overly tricky."]
                                              else [5, "4 to 6 letter words, simple and very common vocabulary", "Provide very plain, straightforward dictionary definitions that are extremely easy to guess."]
                                              end
    
    prompt = <<~PROMPT
      You are a crossword puzzle generator.
      The user's profile includes these details: #{profile_info}.
      Randomly select 1 or 2 of these profile topics and generate exactly #{word_count} words for a crossword puzzle themed around them. (For example, if their career is Healthcare, include words like HOSPITAL, NURSE, GLOVES, etc).
      Requirements for this difficulty: #{complexity_desc}.
      Clue writing style: #{clue_style}
      Return ONLY a JSON array in this format, with no markdown formatting:
      [
        { "word": "EXAMPLE", "clue": "A representative form or pattern" }
      ]
      Ensure ALL words are single words (no spaces or hyphens), entirely UPPERCASE, and contain only English letters A-Z.
      CRITICAL: This must be a unique puzzle. Random seed: #{rand(10000..99999)}. Do not repeat common words.
    PROMPT
    
    req = Net::HTTP::Post.new(uri)
    req['Content-Type'] = 'application/json'
    req.body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8 }
    }.to_json
    
    retries = 3
    begin
      res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true, read_timeout: 30) do |http|
        http.request(req)
      end
      
      if res.is_a?(Net::HTTPSuccess)
        data = JSON.parse(res.body)
        text = data.dig('candidates', 0, 'content', 'parts', 0, 'text') || '[]'
        text = text.gsub("```json", "").gsub("```", "").strip
        begin
          return JSON.parse(text)
        rescue
          return []
        end
      elsif res.code == '503'
        raise Net::HTTPFatalError.new("503 Service Unavailable", res)
      else
        Rails.logger.error "Gemini Text Error: #{res.body}"
        return []
      end
    rescue => e
      if retries > 0
        retries -= 1
        sleep(1)
        retry
      else
        Rails.logger.error "Gemini Text Exception: #{e.message}"
        return []
      end
    end
  end
  def self.generate_missing_word_data(profile_info = "General Knowledge")
    api_key = ENV['GEMINI_API_KEY']
    return nil unless api_key.present?
    
    uri = URI("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=#{api_key}")
    
    prompt = <<~PROMPT
      You are generating data for a "Missing Word" game.
      The user's profile includes these details: #{profile_info}.
      Generate a meaningful and interesting sentence inspired by these profile details. 
      Pick exactly one key word from the sentence that is missing. The missing word should be a plain alphabetical word (no punctuation or spaces).
      Replace that exact word in the sentence with the literal string '[MISSING_WORD]'.
      Return ONLY a JSON object in this format, with no markdown formatting:
      { "sentence": "I used to be a [MISSING_WORD] at the local hospital.", "missing_word": "nurse" }
    PROMPT
    
    req = Net::HTTP::Post.new(uri)
    req['Content-Type'] = 'application/json'
    req.body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8 }
    }.to_json
    
    retries = 3
    begin
      res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true, read_timeout: 30) do |http|
        http.request(req)
      end
      
      if res.is_a?(Net::HTTPSuccess)
        data = JSON.parse(res.body)
        text = data.dig('candidates', 0, 'content', 'parts', 0, 'text') || '{}'
        text = text.gsub("```json", "").gsub("```", "").strip
        begin
          return JSON.parse(text)
        rescue
          return nil
        end
      elsif res.code == '503'
        raise Net::HTTPFatalError.new("503 Service Unavailable", res)
      else
        Rails.logger.error "Gemini Missing Word Error: #{res.body}"
        return nil
      end
    rescue => e
      if retries > 0
        retries -= 1
        sleep(1)
        retry
      else
        Rails.logger.error "Gemini Missing Word Exception: #{e.message}"
        return nil
      end
    end
  end

  def self.generate_career_quiz_data(career_info, life_info)
    api_key = ENV['GEMINI_API_KEY']
    return nil unless api_key.present?
    
    uri = URI("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=#{api_key}")
    
    prompt = <<~PROMPT
      You are generating data for a "Career Quiz" professional simulation game.
      The user's Career background: #{career_info}.
      The user's Life Story: #{life_info}.
      
      Generate exactly 3 unique scenarios based on this specific career field.
      For each scenario, provide a detailed situational challenge that requires professional judgement.
      Provide 3 possible options (A, B, C). One of them must be the correct standard professional approach.
      Provide the 0-based index of the correct option.
      Provide a brief explanation of why it is the correct approach.
      
      Return ONLY a JSON array of 3 objects in this format, with no markdown formatting:
      [
        {
          "scenario": "A patient becomes agitated in the waiting room...",
          "options": ["Ask them to leave", "Calmly approach them and ask how you can help", "Ignore them"],
          "correct_index": 1,
          "explanation": "De-escalation and active listening is the professional standard for healthcare environments."
        }
      ]
    PROMPT
    
    req = Net::HTTP::Post.new(uri)
    req['Content-Type'] = 'application/json'
    req.body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8 }
    }.to_json
    
    retries = 3
    begin
      res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true, read_timeout: 30) do |http|
        http.request(req)
      end
      
      if res.is_a?(Net::HTTPSuccess)
        data = JSON.parse(res.body)
        text = data.dig('candidates', 0, 'content', 'parts', 0, 'text') || '[]'
        text = text.gsub("```json", "").gsub("```", "").strip
        begin
          return JSON.parse(text)
        rescue
          return nil
        end
      elsif res.code == '503'
        raise Net::HTTPFatalError.new("503 Service Unavailable", res)
      else
        Rails.logger.error "Gemini Career Quiz Error: #{res.body}"
        return nil
      end
    rescue => e
      if retries > 0
        retries -= 1
        sleep(1)
        retry
      else
        Rails.logger.error "Gemini Career Quiz Exception: #{e.message}"
        return nil
      end
    end
  end

  def self.generate_word_search_data(difficulty, profile_info)
    api_key = ENV['GEMINI_API_KEY']
    return [] unless api_key.present?
    
    uri = URI("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=#{api_key}")
    
    word_count = case difficulty
                 when 'hard' then 16
                 when 'medium' then 12
                 else 8
                 end
    
    prompt = <<~PROMPT
      You are a game generator building a Word Search puzzle.
      The user's entire profile background is: #{profile_info}.
      
      Generate exactly #{word_count} unique words related to their profile (e.g. hobbies, career, life story, names, places).
      Requirements:
      - Words must be exactly 1 continuous string of letters (A-Z only).
      - No spaces, no hyphens, no special characters.
      - Words must be between 4 and 10 letters long.
      - All words must be completely uppercase.
      
      Return ONLY a JSON array of strings in this format, with no markdown formatting:
      ["TEACHER", "HISTORY", "CHICAGO", "BAKING"]
    PROMPT
    
    req = Net::HTTP::Post.new(uri)
    req['Content-Type'] = 'application/json'
    req.body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8 }
    }.to_json
    
    retries = 3
    begin
      res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true, read_timeout: 30) do |http|
        http.request(req)
      end
      
      if res.is_a?(Net::HTTPSuccess)
        data = JSON.parse(res.body)
        text = data.dig('candidates', 0, 'content', 'parts', 0, 'text') || '[]'
        text = text.gsub("```json", "").gsub("```", "").strip
        begin
          return JSON.parse(text)
        rescue
          return []
        end
      elsif res.code == '503'
        raise Net::HTTPFatalError.new("503 Service Unavailable", res)
      else
        Rails.logger.error "Gemini Word Search Error: #{res.body}"
        return []
      end
    rescue => e
      if retries > 0
        retries -= 1
        sleep(1)
        retry
      else
        Rails.logger.error "Gemini Word Search Exception: #{e.message}"
        return []
      end
    end
  end

  def self.generate_story_prompts
    api_key = ENV['GEMINI_API_KEY']
    return [] unless api_key.present?
    
    uri = URI("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=#{api_key}")
    
    prompt = <<~PROMPT
      You are generating starting prompts for a fun, creative "Pass and Play" storytelling game.
      Generate exactly 3 short, intriguing starting phrases that a player can use to start a story.
      Make them funny, mysterious, or lighthearted.
      
      Return ONLY a JSON array of strings in this format, with no markdown formatting:
      ["The old dusty clock suddenly chimed thirteen times...", "A stray cat walked into the room carrying a glowing letter...", "We thought it was just a regular Tuesday until..."]
    PROMPT
    
    req = Net::HTTP::Post.new(uri)
    req['Content-Type'] = 'application/json'
    req.body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9 }
    }.to_json
    
    begin
      res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true, read_timeout: 30) do |http|
        http.request(req)
      end
      if res.is_a?(Net::HTTPSuccess)
        data = JSON.parse(res.body)
        text = data.dig('candidates', 0, 'content', 'parts', 0, 'text') || '[]'
        text = text.gsub("```json", "").gsub("```", "").strip
        return JSON.parse(text)
      end
    rescue => e
      Rails.logger.error "Gemini Story Prompts Exception: #{e.message}"
    end
    return ["It was a dark and stormy night...", "The mysterious box finally opened...", "I couldn't believe what I saw in the mirror..."]
  end

  def self.generate_story_continuation(history)
    api_key = ENV['GEMINI_API_KEY']
    return "Suddenly, the computer broke." unless api_key.present?
    
    uri = URI("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=#{api_key}")
    
    prompt = <<~PROMPT
      You are playing a "Pass and Play" storytelling game. 
      The story so far:
      #{history.join(" ")}
      
      It is your turn. Write exactly ONE short, creative sentence to continue the story.
      Make it fun, dramatic, or slightly absurd to keep the game interesting!
      Do not repeat what was already said.
      
      Return ONLY the single sentence as raw text.
    PROMPT
    
    req = Net::HTTP::Post.new(uri)
    req['Content-Type'] = 'application/json'
    req.body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 100 }
    }.to_json
    
    begin
      res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true, read_timeout: 15) do |http|
        http.request(req)
      end
      if res.is_a?(Net::HTTPSuccess)
        data = JSON.parse(res.body)
        text = data.dig('candidates', 0, 'content', 'parts', 0, 'text') || ''
        return text.strip.gsub('"', '')
      end
    rescue => e
      Rails.logger.error "Gemini Story Continuation Exception: #{e.message}"
    end
    return "Then, something unexpected happened."
  end


  def self.generate_critical_thinking_data(difficulty, profile_info)
    api_key = ENV['GEMINI_API_KEY']
    return nil unless api_key.present?
    
    uri = URI("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=#{api_key}")
    
    prompt = <<~PROMPT
      Generate 3 distinct rounds for a "Critical Thinking" game.
      The difficulty level is: #{difficulty}.
      The user's profile is: #{profile_info}.
      
      Difficulty guidelines:
      - Easy: Simple pattern recognition, basic counting, or obvious logical deductions.
      - Medium: Word riddles, sequence completion, and basic multiplication/division math problems.
      - Hard: Multi-step deduction, fractions, probability scenarios.
      - Genius: Advanced brain-teasers, paradoxes, lateral thinking, algebra.
      
      For each round, invent a unique story problem incorporating elements from their profile. 
      Provide the question, the exactly correct answer, and exactly 3 incorrect (but plausible) multiple-choice decoys.
      Keep the text concise.
      
      Return ONLY a raw JSON array of 3 objects with keys "question", "correct", and "decoys" (array of 3 strings).
      Example:
      [
        {
          "question": "If you buy 4 canvases for $15 each, how much do you spend in total?",
          "correct": "$60",
          "decoys": ["$45", "$70", "$55"]
        }
      ]
    PROMPT
    
    req = Net::HTTP::Post.new(uri)
    req['Content-Type'] = 'application/json'
    req.body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8 }
    }.to_json
    
    begin
      res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true, read_timeout: 30) do |http|
        http.request(req)
      end
      if res.is_a?(Net::HTTPSuccess)
        data = JSON.parse(res.body)
        text = data.dig('candidates', 0, 'content', 'parts', 0, 'text') || '[]'
        text = text.gsub("```json", "").gsub("```", "").strip
        
        rounds = JSON.parse(text)
        
        # Shuffle options
        formatted_rounds = rounds.map do |round|
          options = (round['decoys'] + [round['correct']]).shuffle
          {
            'question' => round['question'],
            'correct' => round['correct'],
            'options' => options
          }
        end
        return formatted_rounds
      end
    rescue => e
      Rails.logger.error "Gemini Critical Thinking Exception: #{e.message}"
    end
    return nil
  end

  def self.generate_lets_talk_prompts(profile_info)
    api_key = ENV['GEMINI_API_KEY']
    return ["How are you feeling today?", "What is something you are proud of?", "Tell me about a good memory you have.", "What are you looking forward to?", "What is your favorite hobby?"] unless api_key.present?
    
    uri = URI("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=#{api_key}")
    
    prompt = <<~PROMPT
      You are an empathetic listener generating conversation prompts for a senior user. 
      The user's profile is: #{profile_info}.
      
      Generate exactly 3 open-ended, warm, and inviting questions that encourage the user to speak about their life, career, or interests. 
      Do NOT ask questions that require a yes/no answer.
      Make them sound like they are coming from a caring friend.
      
      Return ONLY a raw JSON array of 3 strings.
      Example: ["Tell me a bit more about your time as an art teacher. What was the most rewarding part?", "I see you enjoy gardening. What's your favorite thing to grow?", "What is a memory from your childhood that always makes you smile?"]
    PROMPT
    
    req = Net::HTTP::Post.new(uri)
    req['Content-Type'] = 'application/json'
    req.body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8 }
    }.to_json
    
    begin
      res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true, read_timeout: 30) do |http|
        http.request(req)
      end
      if res.is_a?(Net::HTTPSuccess)
        data = JSON.parse(res.body)
        text = data.dig('candidates', 0, 'content', 'parts', 0, 'text') || '[]'
        text = text.gsub("```json", "").gsub("```", "").strip
        prompts = JSON.parse(text)
        return prompts if prompts.is_a?(Array) && prompts.any?
      end
    rescue => e
      Rails.logger.error "Gemini Let's Talk Exception: #{e.message}"
    end
    return [
      "Tell me about your day today.",
      "What is a memory that always makes you smile?",
      "If you could visit anywhere, where would it be?"
    ]
  end

  def self.generate_story_sequence_data(difficulty = 'easy', profile_info = 'General Life & Hobbies')
    num_steps = case difficulty.to_s.downcase
                when 'hard' then 6
                when 'medium' then 4
                else 3
                end

    api_key = ENV['GEMINI_API_KEY']
    story_data = nil

    if api_key.present?
      uri = URI("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=#{api_key}")
      
      prompt = <<~PROMPT
        You are a gentle cognitive logic game designer for older adults.
        The user's personal profile and interests: #{profile_info}.
        Create a single, highly coherent, chronological story or everyday activity scene broken down into exactly #{num_steps} sequential steps.
        The sequence must have a crystal-clear cause-and-effect logical order from beginning to end (e.g. preparing, doing, completing/celebrating).
        
        Difficulty: #{difficulty} (#{num_steps} steps).
        
        Return ONLY a JSON object with this exact structure, no markdown formatting:
        {
          "title": "A Day Planting the Spring Garden",
          "theme": "Gardening & Nature",
          "steps": [
            {
              "order": 1,
              "caption": "Gathering fresh seeds, trowel, and gardening gloves in the morning.",
              "image_prompt": "A wooden table with small packets of flower seeds, metal hand trowel, and canvas gardening gloves in warm sunlight",
              "icon": "🌱"
            }
          ]
        }
      PROMPT

      req = Net::HTTP::Post.new(uri)
      req['Content-Type'] = 'application/json'
      req.body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
      }.to_json

      begin
        res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true, read_timeout: 30) do |http|
          http.request(req)
        end

        if res.is_a?(Net::HTTPSuccess)
          data = JSON.parse(res.body)
          text = data.dig('candidates', 0, 'content', 'parts', 0, 'text') || '{}'
          text = text.gsub("```json", "").gsub("```", "").strip
          parsed = JSON.parse(text)
          if parsed['steps'].is_a?(Array) && parsed['steps'].length == num_steps
            story_data = parsed
          end
        end
      rescue => e
        Rails.logger.error "Gemini Story Sequence Text Exception: #{e.message}"
      end
    end

    # Built-in robust fallbacks tailored to profile themes if API is offline or returns nil
    unless story_data && story_data['steps'].present?
      story_data = fallback_story_sequence(num_steps)
    end

    # Concurrently generate images if API key is available
    if api_key.present? && story_data && story_data['steps'].present?
      threads = []
      story_data['steps'].each do |step|
        threads << Thread.new do
          img_prompt = step['image_prompt'] || step['caption']
          base64_img = generate_image(img_prompt)
          step['image_base64'] = base64_img if base64_img.present?
        end
      end
      threads.each(&:join)
    end

    story_data
  end

  def self.fallback_story_sequence(num_steps)
    stories_3 = [
      {
        "title" => "Baking a Fresh Loaf of Bread",
        "theme" => "Cooking & Baking",
        "steps" => [
          { "order" => 1, "caption" => "Measuring the flour, yeast, and warm water into a large mixing bowl.", "icon" => "🥣", "image_prompt" => "Rustic kitchen counter with flour, yeast packet, and mixing bowl" },
          { "order" => 2, "caption" => "Kneading the smooth dough and placing it in a warm pan to rise.", "icon" => "🍞", "image_prompt" => "Hands gently kneading bread dough on a wooden floured cutting board" },
          { "order" => 3, "caption" => "Taking the golden-brown, warm loaf out of the oven to cool.", "icon" => "✨", "image_prompt" => "Freshly baked golden brown crusty bread loaf cooling on a wire rack" }
        ]
      },
      {
        "title" => "Planting Sunflowers in the Garden",
        "theme" => "Gardening & Nature",
        "steps" => [
          { "order" => 1, "caption" => "Digging small holes in the rich garden soil with a hand trowel.", "icon" => "🌱", "image_prompt" => "Rich dark garden soil being dug with a hand trowel on a sunny morning" },
          { "order" => 2, "caption" => "Placing the sunflower seeds in the ground and gently covering them with soil.", "icon" => "🌻", "image_prompt" => "Planting small black sunflower seeds into freshly dug soil" },
          { "order" => 3, "caption" => "Watering the soil thoroughly with a green watering can.", "icon" => "💧", "image_prompt" => "Water pouring gently from a green watering can onto garden soil" }
        ]
      },
      {
        "title" => "A Morning Walk with the Dog",
        "theme" => "Pets & Companionship",
        "steps" => [
          { "order" => 1, "caption" => "Putting on comfortable walking shoes and clipping on the dog's leash.", "icon" => "👟", "image_prompt" => "Clipping a red leash onto a happy golden retriever collar" },
          { "order" => 2, "caption" => "Walking together down a quiet, tree-lined neighborhood sidewalk in the morning.", "icon" => "🌳", "image_prompt" => "A person walking a dog on a scenic sunny park pathway" },
          { "order" => 3, "caption" => "Returning home happy and refilling the fresh water bowl.", "icon" => "🏡", "image_prompt" => "Happy dog drinking water from a stainless steel bowl at home" }
        ]
      }
    ]

    stories_4 = [
      {
        "title" => "Brewing a Relaxing Cup of Afternoon Tea",
        "theme" => "Relaxation & Daily Routines",
        "steps" => [
          { "order" => 1, "caption" => "Filling the kettle with fresh cool water and placing it on the stove.", "icon" => "🫖", "image_prompt" => "Vintage stainless steel tea kettle being filled with water under a faucet" },
          { "order" => 2, "caption" => "The kettle whistles as the water reaches a rolling boil.", "icon" => "💨", "image_prompt" => "Steam rising from a hot whistling tea kettle on the stove" },
          { "order" => 3, "caption" => "Pouring steaming hot water over favorite herbal tea leaves in a porcelain teapot.", "icon" => "🌿", "image_prompt" => "Hot water pouring into a white porcelain teapot with loose tea leaves" },
          { "order" => 4, "caption" => "Pouring the soothing tea into a teacup with a slice of lemon and honey.", "icon" => "☕", "image_prompt" => "Warm cup of tea with honey and a lemon slice beside a sunny window" }
        ]
      },
      {
        "title" => "Painting a Watercolor Landscape",
        "theme" => "Arts & Creativity",
        "steps" => [
          { "order" => 1, "caption" => "Setting up the easel, watercolor paper, brushes, and clean water jars.", "icon" => "🎨", "image_prompt" => "Art studio table with blank watercolor paper, paint brushes, and water jars" },
          { "order" => 2, "caption" => "Lightly sketching the mountain and lake horizon with a pencil.", "icon" => "✏️", "image_prompt" => "Pencil sketching mountains on textured watercolor paper" },
          { "order" => 3, "caption" => "Applying colorful sky and mountain washes with soft brush strokes.", "icon" => "🖌️", "image_prompt" => "Watercolor brush painting blue and purple wash onto landscape painting" },
          { "order" => 4, "caption" => "Displaying the completed, vibrant landscape painting on the mantle.", "icon" => "🖼️", "image_prompt" => "Beautiful finished watercolor landscape painting framed on a wooden mantle" }
        ]
      }
    ]

    stories_6 = [
      {
        "title" => "Restoring and Caring for a Classic Wooden Clock",
        "theme" => "Craftsmanship & History",
        "steps" => [
          { "order" => 1, "caption" => "Inspecting the antique wooden clock on the workbench with a magnifying glass.", "icon" => "🔍", "image_prompt" => "Antique wooden clock on a workbench examined with tools and magnifying glass" },
          { "order" => 2, "caption" => "Carefully removing the back panel to inspect the brass gears and pendulum.", "icon" => "⚙️", "image_prompt" => "Intricate brass clock gears and pendulum inside an open clock cabinet" },
          { "order" => 3, "caption" => "Gently cleaning the brass movement and applying fine watchmaker oil to each pivot.", "icon" => "🪛", "image_prompt" => "Precision oiler applying a tiny drop of oil to brass clock gear pivots" },
          { "order" => 4, "caption" => "Polishing the rich walnut wood cabinet with natural beeswax polish.", "icon" => "✨", "image_prompt" => "Soft cloth polishing antique walnut wood clock casing to a warm shine" },
          { "order" => 5, "caption" => "Winding the spring mechanism with the original brass winding key.", "icon" => "🗝️", "image_prompt" => "Hand turning a brass key in the winding arbor of a vintage clock face" },
          { "order" => 6, "caption" => "Setting the hands to the exact time as the chime rings melodiously.", "icon" => "🕰️", "image_prompt" => "Restored antique clock ticking on the wall with pendulum swinging gracefully" }
        ]
      },
      {
        "title" => "Preparing a Special Sunday Family Dinner",
        "theme" => "Family & Celebration",
        "steps" => [
          { "order" => 1, "caption" => "Writing out the menu and shopping list in the kitchen.", "icon" => "📋", "image_prompt" => "Handwritten recipe notebook and grocery list on a kitchen counter" },
          { "order" => 2, "caption" => "Selecting fresh vegetables, herbs, and bread at the local farmers market.", "icon" => "🥕", "image_prompt" => "Fresh carrots, rosemary, and sourdough bread in a wicker market basket" },
          { "order" => 3, "caption" => "Chopping vegetables and simmering a savory homemade roast in the oven.", "icon" => "🍲", "image_prompt" => "Chopped herbs and vegetables simmering in a cast iron dutch oven" },
          { "order" => 4, "caption" => "Setting the dining table with fine plates, cloth napkins, and glassware.", "icon" => "🍽️", "image_prompt" => "Warm dining table set with white plates, cloth napkins, and silverware" },
          { "order" => 5, "caption" => "Welcoming loved ones at the front door with warm greetings and smiles.", "icon" => "👋", "image_prompt" => "Front door opening with friendly smiles and welcoming gestures" },
          { "order" => 6, "caption" => "Sitting down together around the table enjoying food, stories, and laughter.", "icon" => "❤️", "image_prompt" => "Happy family enjoying dinner together around a bountiful table" }
        ]
      }
    ]

    case num_steps
    when 6 then stories_6.sample
    when 4 then stories_4.sample
    else stories_3.sample
    end
  end
end
