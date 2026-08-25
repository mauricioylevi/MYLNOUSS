require 'sendgrid-ruby'

class Api::ContactMessagesController < ApplicationController
  skip_before_action :verify_authenticity_token # Since this is an API called from a static frontend

  def create
    @message = ContactMessage.new(message_params)

    if @message.save
      send_email(@message)
      render json: { success: true, message: 'Message sent successfully.' }, status: :created
    else
      render json: { success: false, error: @message.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  private

  def message_params
    params.require(:contact_message).permit(:first_name, :last_name, :email, :phone, :message)
  end

  def send_email(contact_message)
    api_key = ENV['SENDGRID_API_KEY']
    return unless api_key.present?

    from_email = ENV['SENDGRID_FROM_EMAIL'] || 'mauricioylevi@gmail.com'
    to_email = ENV['SENDGRID_TO_EMAIL'] || 'mauricioylevi@gmail.com'

    from = SendGrid::Email.new(email: from_email)
    to = SendGrid::Email.new(email: to_email)
    subject = "New Contact Us Message from #{contact_message.first_name} #{contact_message.last_name}"
    content_text = <<~TEXT
      You have received a new message from the MYLNOUSS Contact Us form.

      Name: #{contact_message.first_name} #{contact_message.last_name}
      Email: #{contact_message.email}
      Phone: #{contact_message.phone}

      Message:
      #{contact_message.message}
    TEXT
    content = SendGrid::Content.new(type: 'text/plain', value: content_text)
    
    mail = SendGrid::Mail.new(from, subject, to, content)
    sg = SendGrid::API.new(api_key: api_key)
    
    begin
      response = sg.client.mail._('send').post(request_body: mail.to_json)
      Rails.logger.info "SendGrid API response code: #{response.status_code}"
    rescue => e
      Rails.logger.error "Failed to send email via SendGrid: #{e.message}"
    end
  end
end
