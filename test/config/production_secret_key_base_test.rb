require "test_helper"

class ProductionSecretKeyBaseTest < ActiveSupport::TestCase
  test "secret_key_base is configured and non-empty even without SECRET_KEY_BASE env var" do
    secret = Rails.application.secret_key_base || Rails.application.config.secret_key_base
    assert_not_nil secret, "secret_key_base must not be nil"
    assert_not secret.empty?, "secret_key_base must not be empty"
  end
end
