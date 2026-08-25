require "test_helper"

class GamesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = MainUser.first || MainUser.create!
  end

  test "should get photo_memory json format" do
    # Mock cache so it doesn't try to generate
    mock_game_cache(
      game_type: 'photo_memory',
      payload: { 'rounds' => [{ 'photo_id' => 1 }] }
    )
    
    get "/games/photo_memory", params: { format: :json }
    assert_response :success
    json_response = JSON.parse(response.body)
    assert json_response['success']
    assert_equal 1, json_response['rounds'].length
  end

  test "generate_critical_thinking returns json payload" do
    # Mock GeminiService behavior directly for this integration test
    GeminiService.stubs(:generate_critical_thinking_data).returns([{ "question" => "Test?" }])
    
    post "/api/games/generate_critical_thinking", params: { difficulty: 'easy' }
    assert_response :success
    json_response = JSON.parse(response.body)
    
    assert json_response['success']
    assert_equal "Test?", json_response['rounds'][0]['question']
  end

  test "generate_lets_talk returns json payload" do
    GeminiService.stubs(:generate_lets_talk_prompts).returns(["Prompt 1", "Prompt 2"])
    
    post "/api/games/generate_lets_talk"
    assert_response :success
    json_response = JSON.parse(response.body)
    
    assert json_response['success']
    assert_equal "Prompt 1", json_response['prompts'][0]
  end

  test "story_prompts returns json" do
    GeminiService.stubs(:generate_story_prompts).returns(["Prompt A"])
    post "/api/story/prompts"
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_equal "Prompt A", json_response['prompts'][0]
  end

  test "story_ai_turn returns json" do
    GeminiService.stubs(:generate_story_continuation).returns("And then...")
    post "/api/story/ai_turn", params: { history: ["Once upon a time"] }
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_equal "And then...", json_response['sentence']
  end

  test "cards_match returns fallback deck if not enough photos" do
    # Ensure no photos exist
    Photo.destroy_all
    
    GeminiService.stubs(:generate_image).returns("fake_base64")
    
    get "/games/cards_match", params: { difficulty: 'easy' }
    assert_response :success
    json_response = JSON.parse(response.body)
    
    assert json_response['success']
    # Easy needs 4 pairs = 8 total cards
    assert_equal 8, json_response['deck'].length
  end

  test "crossword returns json" do
    mock_game_cache(game_type: 'crossword', difficulty: 'easy', payload: { 'words' => [] })
    get "/games/crossword", params: { format: :json, difficulty: 'easy' }
    assert_response :success
  end

  test "missing_word returns json" do
    mock_game_cache(game_type: 'missing_word', payload: { 'game_data' => {} })
    get "/games/missing_word", params: { format: :json }
    assert_response :success
  end

  test "profile_quiz returns json" do
    GeminiService.stubs(:generate_quiz_data).returns([{ "subject" => "Test", "choices" => ["1", "2"], "answer" => "1" }])
    GeminiService.stubs(:generate_image).returns("base64")
    get "/games/profile_quiz", params: { format: :json }
    assert_response :success
  end

  # HTML Views
  test "should get career_quiz" do
    get "/games/career_quiz"
    assert_response :success
  end

  test "should get tic_tac_toe" do
    get "/games/tic_tac_toe"
    assert_response :success
  end

  test "should get gallery" do
    get "/games/gallery"
    assert_response :success
  end

  test "should get create_a_story" do
    get "/games/create_a_story"
    assert_response :success
  end

  test "should get lets_talk" do
    get "/games/lets_talk"
    assert_response :success
  end
end
