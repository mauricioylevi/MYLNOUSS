require "test_helper"

class PublicControllerTest < ActionDispatch::IntegrationTest
  test "should get site" do
    get public_site_url
    assert_response :success
  end
end
