class GuestMailer < ApplicationMailer
  default from: 'invitations@mylnouss.com'

  def invitation_email(guest)
    @guest = guest
    @url  = new_guest_registration_url(token: @guest.invitation_token)
    mail(to: @guest.email, subject: 'You have been invited to MYLNOUSS!')
  end
end
