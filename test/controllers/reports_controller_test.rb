require "test_helper"

class ReportsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @guest = Guest.create!(name: "Test Guest", email: "guest@example.com")
    UserLogin.create!(user_type: "Admin")
    GameEvent.create!(game_name: "crossword", event_type: "started")
    GameEvent.create!(game_name: "crossword", event_type: "completed")
    DailyJournal.create!(date: Date.today)
  end

  test "should get guest_access" do
    get reports_guest_access_url
    assert_response :success
  end

  test "should get wellness" do
    get reports_wellness_url
    assert_response :success
  end

  test "should get log_report" do
    get reports_log_report_url
    assert_response :success
  end
end
