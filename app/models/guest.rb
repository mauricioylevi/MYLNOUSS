class Guest < ApplicationRecord
  has_secure_password validations: false

  # Ensure password is required only if registered is true, or when setting it
  validates :password, presence: true, if: -> { registered? && password_digest_changed? }
  validates :email, presence: true, uniqueness: true

  # Auto-generate invitation token when creating a new unregistered guest
  before_create :generate_invitation_token, unless: :registered?

  private

  def generate_invitation_token
    self.invitation_token = SecureRandom.urlsafe_base64
  end
end
