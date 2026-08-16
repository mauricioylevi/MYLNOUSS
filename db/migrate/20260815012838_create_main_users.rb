class CreateMainUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :main_users do |t|
      t.jsonb :profile_data

      t.timestamps
    end
  end
end
