module TestHelperMocks
  def mock_game_cache(game_type:, difficulty: nil, payload: {})
    user = MainUser.first || MainUser.create!
    
    # Overwrite if exists to simulate caching behavior properly
    cache = GameCache.find_or_initialize_by(
      main_user_id: user.id,
      game_type: game_type,
      difficulty: difficulty
    )
    cache.payload = payload
    cache.save!
    cache
  end
end
