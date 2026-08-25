require "test_helper"

class DatabaseConfigTest < ActiveSupport::TestCase
  test "database configuration supports DATABASE_URL" do
    ENV.stub(:[], "postgres://user:pass@localhost:5432/test_db") do
      config = ActiveRecord::Base.configurations.configs_for(env_name: "production", spec_name: "primary")
      assert_not_nil config
    end
  end
end
