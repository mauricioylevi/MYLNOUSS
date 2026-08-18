class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # Changes to the importmap will invalidate the etag for HTML responses
  stale_when_importmap_changes

  before_action :track_user_login

  private

  def track_user_login
    # Avoid tracking API or AJAX requests
    return if request.xhr? || request.format.json? || request.path.start_with?('/api') || request.path.start_with?('/rails')

    if params[:token].present?
      main_user = MainUser.first
      if main_user && main_user.access_token == params[:token]
        # It's a Main User login
        unless session[:user_type] == 'Main User' && session[:login_date] == Date.today.to_s
          session[:user_type] = 'Main User'
          session[:guest_id] = nil
          session[:login_date] = Date.today.to_s
          UserLogin.create(user_type: 'Main User')
        end
      elsif guest = Guest.find_by(access_token: params[:token])
        # It's a Guest login
        unless session[:user_type] == 'Guest' && session[:guest_id] == guest.id && session[:login_date] == Date.today.to_s
          session[:user_type] = 'Guest'
          session[:guest_id] = guest.id
          session[:login_date] = Date.today.to_s
          UserLogin.create(user_type: 'Guest', guest_id: guest.id)
        end
      end
    else
      # No token. If no session exists, assume Admin
      unless session[:user_type]
        session[:user_type] = 'Admin'
        session[:guest_id] = nil
        session[:login_date] = Date.today.to_s
        UserLogin.create(user_type: 'Admin')
      end
    end
  end
end
