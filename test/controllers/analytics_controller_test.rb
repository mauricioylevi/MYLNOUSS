require "test_helper"

class AnalyticsControllerTest < ActionDispatch::IntegrationTest
  test "should log event" do
    assert_difference("GameEvent.count") do
      post api_analytics_log_event_url, params: { game_name: "tic_tac_toe", event_type: "started" }
    end
    assert_response :success
    json_response = JSON.parse(response.body)
    assert json_response['success']
  end

  test "should fail to log event if missing params" do
    assert_no_difference("GameEvent.count") do
      post api_analytics_log_event_url, params: { game_name: "tic_tac_toe" }
    end
    assert_response :unprocessable_entity
  end
end
