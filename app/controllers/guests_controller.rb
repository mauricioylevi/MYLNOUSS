class GuestsController < ApplicationController
  def index
    @guests = Guest.all
    @main_user = MainUser.first || MainUser.create
    @guest = Guest.new
  end

  def new
    @guest = Guest.new
  end

  def create
    @guest = Guest.new(guest_params)
    
    if @guest.save
      GuestMailer.invitation_email(@guest).deliver_later
      redirect_to guests_path, notice: "Guest invitation sent successfully to #{@guest.email}."
    else
      @guests = Guest.all
      @main_user = MainUser.first || MainUser.create
      render :index, status: :unprocessable_entity
    end
  end

  def generate_main_user_token
    @main_user = MainUser.first || MainUser.create
    @main_user.update(access_token: SecureRandom.urlsafe_base64)
    redirect_to guests_path, notice: "Main User access token generated."
  end

  private

  def guest_params
    params.require(:guest).permit(:name, :email, :can_post_photos, :can_play_games, :can_read_journals)
  end
end
