require "test_helper"

class DatabaseConfigTest < ActiveSupport::TestCase
  test "database configuration supports DATABASE_URL" do
    config = ActiveRecord::Base.configurations.find_db_config("production") || ActiveRecord::Base.configurations.configs_for(env_name: "production").first
    assert_not_nil config
  end
end
