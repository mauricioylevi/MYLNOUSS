class ReportsController < ApplicationController
  def guest_access
    @guests = Guest.all.order(created_at: :desc)
  end

  def wellness
    @total_started = GameEvent.where(event_type: 'started').count
    @total_completed = GameEvent.where(event_type: 'completed').count
    @total_abandoned = @total_started - @total_completed

    @completion_rate = @total_started > 0 ? ((@total_completed.to_f / @total_started) * 100).round(1) : 0

    # Calculate preferred games
    game_starts = GameEvent.where(event_type: 'started').group(:game_name).count
    game_completions = GameEvent.where(event_type: 'completed').group(:game_name).count
    
    @game_stats = game_starts.map do |game_name, starts|
      comps = game_completions[game_name] || 0
      {
        name: game_name,
        started: starts,
        completed: comps,
        abandoned: starts - comps,
        rate: starts > 0 ? ((comps.to_f / starts) * 100).round(1) : 0
      }
    end.sort_by { |s| -s[:started] } # Sort by most played

    # Journal Stats
    @total_journals = DailyJournal.count
    first_journal = DailyJournal.order(date: :asc).first
    if first_journal
      @days_since_first = (Date.today - first_journal.date).to_i + 1
      @journal_consistency = ((@total_journals.to_f / @days_since_first) * 100).round(1)
    else
      @days_since_first = 0
      @journal_consistency = 0
    end

    # Usage Metrics
    @max_photos = 100
    @max_guests = 5

    @admin_photos_count = Photo.where(author_type: 'Admin').count
    @guest_photos_count = Photo.where(author_type: 'Guest').count
    @total_photos = Photo.count
    @photos_remaining = [@max_photos - @total_photos, 0].max

    @total_guests = Guest.count
    @guests_remaining = [@max_guests - @total_guests, 0].max
  end
end
