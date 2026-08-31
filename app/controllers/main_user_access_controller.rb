class MainUserAccessController < ApplicationController
  def index
    @main_user = MainUser.first || MainUser.create
  end

  def generate_token
    @main_user = MainUser.first || MainUser.create
    @main_user.update(access_token: SecureRandom.urlsafe_base64(24))
    redirect_to main_user_access_path, notice: "Main User access token generated successfully."
  end

  def revoke_token
    @main_user = MainUser.first || MainUser.create
    @main_user.update(access_token: nil)
    redirect_to main_user_access_path, notice: "Main User access token has been revoked."
  end
end
