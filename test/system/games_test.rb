require "application_system_test_case"

class GamesTest < ApplicationSystemTestCase
  test "visiting word search with cached data" do
    # Mock the AI generation by inserting a pre-computed payload into GameCache
    mock_game_cache(
      game_type: 'word_search',
      difficulty: 'easy',
      payload: {
        'words' => ['DOG', 'CAT', 'BIRD']
      }
    )

    visit '/games/word_search?difficulty=easy'

    assert_selector "h2", text: "Word Search"
    assert_selector "select#word-search-difficulty"
    
    # Since we provided a cache with words, it should render the game board and not "Generating..."
    assert_selector "h3", text: "Words to Find"
    assert_selector "#word-search-list"
  end

  test "visiting word search when generation is still running" do
    # Do not mock cache here. It should trigger generation and show the waiting UI.
    visit '/games/word_search?difficulty=easy'

    assert_selector "h2", text: "Word Search"
    
    # It should say generating
    assert_text "Generating your puzzle"
  end

  test "visiting career quiz with cached data" do
    mock_game_cache(
      game_type: 'career_quiz',
      payload: {
        'rounds' => [
          { 'scenario' => 'Test scenario 123', 'options' => ['A', 'B'], 'correct_index' => 0, 'explanation' => 'Explain' }
        ]
      }
    )

    visit '/games/career_quiz'

    assert_selector "h2", text: "Career Quiz"
    assert_text "Test scenario 123"
  end

  test "visiting critical thinking" do
    mock_game_cache(
      game_type: 'critical_thinking',
      difficulty: 'easy',
      payload: {
        'rounds' => [
          { 'question' => 'Critical question 456', 'options' => ['1', '2'], 'correct' => '1' }
        ]
      }
    )

    visit '/games/critical_thinking?difficulty=easy'

    assert_selector "h2", text: "Critical Thinking"
    assert_text "Critical question 456"
  end
end
