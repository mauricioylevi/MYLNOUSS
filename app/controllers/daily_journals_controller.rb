class DailyJournalsController < ApplicationController
  def index
    @user = MainUser.first || MainUser.create
    # Group by date and count the number of log submissions
    @journal_stats = DailyJournal.where(main_user_id: @user.id)
                                 .group(:date)
                                 .order(date: :desc)
                                 .count
  end

  def show
    @user = MainUser.first || MainUser.create
    @date = Date.parse(params[:id]) rescue nil
    
    if @date.nil?
      redirect_to daily_journals_path, alert: "Invalid date format."
      return
    end

    @journals = DailyJournal.where(main_user_id: @user.id, date: @date).order(created_at: :desc)
    
    if @journals.empty?
      redirect_to daily_journals_path, alert: "Journal entries not found."
    end
  end

  def today
    @user = MainUser.first || MainUser.create
    # Always a blank slate for new logs
    @journal = DailyJournal.new(main_user_id: @user.id, date: Date.today)
    @journal.entries = {}
  end

  def create
    @user = MainUser.first || MainUser.create
    
    entries = {}
    ['exercise', 'book', 'news', 'hobby', 'movie', 'games', 'invite'].each do |key|
      entries[key] = params[key] if params[key].present?
    end
    
    if entries.empty?
      redirect_to today_daily_journals_path, alert: "Please write something before saving."
      return
    end

    @journal = DailyJournal.new(main_user_id: @user.id, date: Date.today, entries: entries)
    
    if @journal.save
      redirect_to today_daily_journals_path, notice: "Journal log saved successfully!"
    else
      redirect_to today_daily_journals_path, alert: "Failed to save journal."
    end
  end
end
