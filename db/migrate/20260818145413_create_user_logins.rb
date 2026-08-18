class CreateUserLogins < ActiveRecord::Migration[8.1]
  def change
    create_table :user_logins do |t|
      t.string :user_type
      t.integer :guest_id

      t.timestamps
    end
  end
end
