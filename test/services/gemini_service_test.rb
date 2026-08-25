require "test_helper"

class GeminiServiceTest < ActiveSupport::TestCase
  test "methods return nil or empty when GEMINI_API_KEY is missing" do
    # When API key is not present, all methods return fallbacks or nil/empty
    ENV.stub(:[], nil) do
      assert_equal [], GeminiService.generate_quiz_data(["Reading"])
      assert_nil GeminiService.generate_image("A cat")
      assert_nil GeminiService.generate_memory_question("base64")
      assert_equal [], GeminiService.generate_crossword_data("easy")
      assert_nil GeminiService.generate_missing_word_data("Profile")
      assert_nil GeminiService.generate_career_quiz_data("Doctor", "Life")
      assert_equal [], GeminiService.generate_word_search_data("easy", "Profile")
      assert_equal ["It was a dark and stormy night...", "The mysterious box finally opened...", "I couldn't believe what I saw in the mirror..."], GeminiService.generate_story_prompts
      assert_equal "Suddenly, the computer broke.", GeminiService.generate_story_continuation(["Once upon a time"])
      assert_nil GeminiService.generate_critical_thinking_data("easy", "Profile")
      assert_equal 5, GeminiService.generate_lets_talk_prompts("Profile").length
    end
  end

  test "generate_quiz_data parses json response" do
    ENV.stub(:[], "fake_key") do
      mock_response = Net::HTTPSuccess.new(1.0, "200", "OK")
      mock_response.stubs(:body).returns({
        candidates: [{ content: { parts: [{ text: '[{"subject": "Camera", "choices": ["A", "B"], "answer": "A"}]' }] } }]
      }.to_json)

      Net::HTTP.stubs(:start).returns(mock_response)

      result = GeminiService.generate_quiz_data(["Photography"])
      assert_equal 1, result.length
      assert_equal "Camera", result.first["subject"]
    end
  end

  test "generate_story_prompts parses response" do
    ENV.stub(:[], "fake_key") do
      mock_response = Net::HTTPSuccess.new(1.0, "200", "OK")
      mock_response.stubs(:body).returns({
        candidates: [{ content: { parts: [{ text: '["Prompt 1", "Prompt 2"]' }] } }]
      }.to_json)

      Net::HTTP.stubs(:start).returns(mock_response)

      result = GeminiService.generate_story_prompts
      assert_equal ["Prompt 1", "Prompt 2"], result
    end
  end
end
