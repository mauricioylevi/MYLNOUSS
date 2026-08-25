require "test_helper"

class DashboardControllerTest < ActionDispatch::IntegrationTest
  include ActiveJob::TestHelper

  setup do
    @user = MainUser.first || MainUser.create!
  end

  test "should get index and enqueue jobs" do
    assert_enqueued_jobs 7 do
      get dashboard_url
    end
    assert_response :success
  end

  test "should get index and skip jobs if recently cached" do
    %w[crossword missing_word photo_memory career_quiz word_search critical_thinking lets_talk].each do |game_type|
      GameCache.create!(main_user: @user, game_type: game_type)
    end
    
    assert_enqueued_jobs 0 do
      get dashboard_url
    end
    assert_response :success
  end

  test "should get profile" do
    get profile_url
    assert_response :success
  end

  test "should update profile" do
    post "/profile/update", params: { hobbies: ["reading", "biking"] }
    assert_response :success
    json_response = JSON.parse(response.body)
    assert json_response['success']
    
    @user.reload
    assert_equal ["reading", "biking"], @user.profile_data["hobbies"]
  end
end
