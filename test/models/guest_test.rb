require "test_helper"

class GuestTest < ActiveSupport::TestCase
  test "should auto generate invitation token before create if not registered" do
    guest = Guest.create!(name: "Test", email: "test@example.com")
    assert_not_nil guest.invitation_token
  end

  test "should not auto generate token if registered" do
    guest = Guest.new(name: "Test2", email: "test2@example.com", registered: true)
    # Need password since it's registered
    guest.password = "secure123"
    guest.save!
    assert_nil guest.invitation_token
  end

  test "should require password if registered" do
    guest = Guest.new(name: "Test3", email: "test3@example.com", registered: true)
    assert_not guest.valid?
    assert_includes guest.errors[:password], "can't be blank"
  end
end
