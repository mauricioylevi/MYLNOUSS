class AnalyticsController < ApplicationController
  skip_before_action :verify_authenticity_token, only: [:log_event]

  def log_event
    @user = MainUser.first || MainUser.create
    game_name = params[:game_name]
    event_type = params[:event_type]

    if game_name.present? && event_type.present?
      GameEvent.create(main_user_id: @user.id, game_name: game_name, event_type: event_type)
      render json: { success: true }
    else
      render json: { success: false, error: 'Missing parameters' }, status: :unprocessable_entity
    end
  end
end
