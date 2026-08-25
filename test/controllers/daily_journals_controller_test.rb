require "test_helper"

class DailyJournalsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = MainUser.create!
    @journal = DailyJournal.create!(main_user: @user, date: Date.today, entries: { 'exercise' => 'walk' })
  end

  test "should get index" do
    get daily_journals_url
    assert_response :success
  end

  test "should get show for date" do
    get daily_journal_url(Date.today.to_s)
    assert_response :success
  end

  test "should redirect show for invalid date" do
    get daily_journal_url("invalid-date")
    assert_redirected_to daily_journals_url
  end

  test "should redirect show for empty date" do
    get daily_journal_url(10.days.ago.to_date.to_s)
    assert_redirected_to daily_journals_url
  end

  test "should get today" do
    get today_daily_journals_url
    assert_response :success
  end

  test "should create journal log" do
    assert_difference("DailyJournal.count") do
      post daily_journals_url, params: { exercise: "Ran 5k", book: "Read a chapter" }
    end
    assert_redirected_to today_daily_journals_url
  end

  test "should not create journal log if empty" do
    assert_no_difference("DailyJournal.count") do
      post daily_journals_url, params: {}
    end
    assert_redirected_to today_daily_journals_url
  end
end
