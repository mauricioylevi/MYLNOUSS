class DashboardController < ApplicationController
  def index
    @user = MainUser.first
    if @user
      # Background generation for games that rely on profile/photo data
      %w[crossword missing_word photo_memory career_quiz word_search photo_trivia critical_thinking lets_talk].each do |game_type|
        # Avoid duplicating generation if already recently cached
        unless GameCache.where(main_user_id: @user.id, game_type: game_type).where('updated_at > ?', 1.hour.ago).exists?
          GameGenerationJob.perform_later(@user.id, game_type)
        end
      end
    end
  end

  def update_profile
    @user = MainUser.first || MainUser.new
    @user.profile_data = params.permit!.to_h.except("controller", "action")
    if @user.save
      render json: { success: true }
    else
      render json: { success: false, error: @user.errors.full_messages }, status: :unprocessable_entity
    end
  end
end
