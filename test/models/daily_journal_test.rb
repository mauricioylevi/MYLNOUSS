require "test_helper"

class DailyJournalTest < ActiveSupport::TestCase
  test "should not save without user" do
    journal = DailyJournal.new(date: Date.today)
    assert_not journal.save, "Saved journal without user"
  end

  test "should save with user and date" do
    user = MainUser.create!
    journal = DailyJournal.new(main_user: user, date: Date.today)
    assert journal.save
  end
end
