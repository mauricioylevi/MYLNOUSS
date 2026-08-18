Rails.application.routes.draw do
  get "public/site"
  root "dashboard#index"
  resources :photos, only: [:index, :create, :update, :destroy] do
    collection do
      get :drafts
      get :fingerprints
    end
    member do
      post :generate_audio
    end
  end

  # Reports
  get 'reports/guest_access', to: 'reports#guest_access'
  get 'reports/wellness', to: 'reports#wellness'

  post 'api/analytics/log_event', to: 'analytics#log_event'

  get 'profile', to: 'dashboard#profile'
  post 'profile/update', to: 'dashboard#update_profile'

  # Games
  get 'games/profile_quiz', to: 'games#profile_quiz'
  get 'games/career_quiz', to: 'games#career_quiz'
  get 'games/photo_memory', to: 'games#photo_memory'
  get 'games/cards_match', to: 'games#cards_match'
  get 'games/crossword', to: 'games#crossword'
  get 'games/gallery', to: 'games#gallery'
  get 'games/missing_word', to: 'games#missing_word'
  get 'games/tic_tac_toe', to: 'games#tic_tac_toe'
  get 'games/word_search', to: 'games#word_search'
  get 'games/create_a_story', to: 'games#create_a_story'
  get 'games/critical_thinking', to: 'games#critical_thinking'
  get 'games/lets_talk', to: 'games#lets_talk'
  
  post 'api/games/generate_critical_thinking', to: 'games#generate_critical_thinking'
  post 'api/games/generate_lets_talk', to: 'games#generate_lets_talk'
  
  post 'api/story/prompts', to: 'games#story_prompts'
  post 'api/story/ai_turn', to: 'games#story_ai_turn'

  resources :daily_journals, only: [:index, :show, :create] do
    collection do
      get :today
    end
  end

  resources :guests, only: [:index, :new, :create, :update, :destroy] do
    collection do
      post :generate_main_user_token
    end
  end
  resources :guest_registrations, only: [:new, :create]
end
