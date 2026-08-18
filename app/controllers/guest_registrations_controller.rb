class GuestRegistrationsController < ApplicationController
  layout 'application'

  def new
    @guest = Guest.find_by(invitation_token: params[:token])
    if @guest.nil? || @guest.registered?
      redirect_to root_path, alert: "Invalid or expired invitation link."
    end
  end

  def create
    @guest = Guest.find_by(invitation_token: params[:token])
    
    if @guest.nil? || @guest.registered?
      redirect_to root_path, alert: "Invalid or expired invitation link."
      return
    end

    if @guest.update(password: params[:password], registered: true, invitation_token: nil)
      # For now just redirect to root or login page since they are set up
      redirect_to root_path, notice: "Your password has been set successfully! You can now access MYLNOUSS."
    else
      flash.now[:alert] = "Could not set password. Make sure it isn't blank."
      render :new, status: :unprocessable_entity
    end
  end
end
