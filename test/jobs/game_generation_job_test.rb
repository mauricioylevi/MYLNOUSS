require "test_helper"

class GameGenerationJobTest < ActiveJob::TestCase
  setup do
    @user = MainUser.create!(profile_data: {
      "inputs" => {
        "prof_career" => "Doctor",
        "prof_experience" => "20 years",
        "prof_life_desc" => "Loves helping people"
      },
      "hobbies" => ["Reading", "Gardening"]
    })
  end

  test "performs crossword game generation" do
    GeminiService.stubs(:generate_crossword_data).returns(["PUZZLE", "SOLVE"])

    assert_difference("GameCache.count", 1) do
      GameGenerationJob.perform_now(@user.id, 'crossword', 'easy')
    end

    cache = GameCache.last
    assert_equal 'crossword', cache.game_type
    assert_equal ['PUZZLE', 'SOLVE'], cache.payload['words']
  end

  test "performs missing_word game generation" do
    GeminiService.stubs(:generate_missing_word_data).returns({ "sentence" => "Hello [MISSING_WORD]", "missing_word" => "world" })

    assert_difference("GameCache.count", 1) do
      GameGenerationJob.perform_now(@user.id, 'missing_word')
    end

    cache = GameCache.last
    assert_equal 'missing_word', cache.game_type
  end

  test "performs career_quiz game generation" do
    GeminiService.stubs(:generate_career_quiz_data).returns([{ "scenario" => "Patient arrives", "options" => ["A", "B"], "correct_index" => 0 }])

    assert_difference("GameCache.count", 1) do
      GameGenerationJob.perform_now(@user.id, 'career_quiz')
    end

    cache = GameCache.last
    assert_equal 'career_quiz', cache.game_type
  end

  test "performs word_search game generation" do
    GeminiService.stubs(:generate_word_search_data).returns(["SEARCH", "FIND"])

    assert_difference("GameCache.count", 1) do
      GameGenerationJob.perform_now(@user.id, 'word_search', 'easy')
    end

    cache = GameCache.last
    assert_equal 'word_search', cache.game_type
  end

  test "performs critical_thinking game generation" do
    GeminiService.stubs(:generate_critical_thinking_data).returns([{ "question" => "Riddle me this", "options" => ["A", "B"] }])

    assert_difference("GameCache.count", 1) do
      GameGenerationJob.perform_now(@user.id, 'critical_thinking', 'hard')
    end

    cache = GameCache.last
    assert_equal 'critical_thinking', cache.game_type
    assert_equal 'hard', cache.difficulty
  end

  test "performs lets_talk game generation" do
    GeminiService.stubs(:generate_lets_talk_prompts).returns(["Question 1", "Question 2"])

    assert_difference("GameCache.count", 1) do
      GameGenerationJob.perform_now(@user.id, 'lets_talk')
    end

    cache = GameCache.last
    assert_equal 'lets_talk', cache.game_type
  end
end
