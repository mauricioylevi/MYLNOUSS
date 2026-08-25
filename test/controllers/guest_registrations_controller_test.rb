require "test_helper"

class GuestRegistrationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @guest = Guest.create!(name: "Invited Guest", email: "invite@example.com")
  end

  test "should get new with token" do
    get new_guest_registration_url(token: @guest.invitation_token)
    assert_response :success
  end

  test "should fail new with bad token" do
    get new_guest_registration_url(token: "bad")
    assert_redirected_to root_url
  end

  test "should complete registration" do
    post guest_registrations_url, params: { token: @guest.invitation_token, password: "securepassword" }
    assert_redirected_to root_url
    @guest.reload
    assert @guest.registered?
    assert_nil @guest.invitation_token
  end
end
