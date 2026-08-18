class AddAccessTokenToMainUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :main_users, :access_token, :string
  end
end
