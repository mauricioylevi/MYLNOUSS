module ApplicationHelper
  def current_category_theme
    case controller_name
    when 'photos', 'guests', 'main_user_access'
      'green'
    when 'daily_journals'
      'blue'
    when 'games'
      'purple'
    when 'reports'
      'teal'
    when 'dashboard'
      action_name == 'profile' ? 'green' : 'neutral'
    else
      'neutral'
    end
  end
end
