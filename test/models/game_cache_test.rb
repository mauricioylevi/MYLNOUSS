require "test_helper"

class GameCacheTest < ActiveSupport::TestCase
  test "saves and loads payload JSON correctly" do
    user = MainUser.create!
    cache = GameCache.create!(
      main_user: user,
      game_type: "test_game",
      difficulty: "easy",
      payload: { "key" => "value", "nested" => [1, 2, 3] }
    )

    loaded_cache = GameCache.find(cache.id)
    assert_equal "value", loaded_cache.payload["key"]
    assert_equal [1, 2, 3], loaded_cache.payload["nested"]
  end

  test "overwrites cache for same user, game, and difficulty" do
    user = MainUser.create!
    
    cache1 = GameCache.find_or_initialize_by(main_user_id: user.id, game_type: "quiz", difficulty: "hard")
    cache1.payload = { "version" => 1 }
    cache1.save!

    cache2 = GameCache.find_or_initialize_by(main_user_id: user.id, game_type: "quiz", difficulty: "hard")
    cache2.payload = { "version" => 2 }
    cache2.save!

    assert_equal 1, GameCache.where(main_user_id: user.id, game_type: "quiz", difficulty: "hard").count
    assert_equal 2, GameCache.last.payload["version"]
  end
end
