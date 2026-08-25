require "test_helper"

class GuestsControllerTest < ActionDispatch::IntegrationTest
  include ActiveJob::TestHelper

  setup do
    @guest = Guest.create!(name: "Test Guest", email: "guest@example.com")
  end

  test "should get index" do
    get guests_url
    assert_response :success
  end

  test "should get new" do
    get new_guest_url
    assert_response :success
  end

  test "should create guest and enqueue email" do
    assert_difference("Guest.count") do
      assert_enqueued_jobs 1 do
        post guests_url, params: { guest: { name: "New Guest", email: "new@example.com", can_post_photos: true } }
      end
    end
    assert_redirected_to guests_url
  end

  test "should update guest" do
    patch guest_url(@guest), params: { guest: { can_post_photos: false } }
    assert_redirected_to guests_url
    @guest.reload
    assert_not @guest.can_post_photos
  end

  test "should destroy guest" do
    assert_difference("Guest.count", -1) do
      delete guest_url(@guest)
    end
    assert_redirected_to guests_url
  end

  test "should generate main user token" do
    post generate_main_user_token_guests_url
    assert_redirected_to guests_url
    user = MainUser.first
    assert_not_nil user.access_token
  end
end
