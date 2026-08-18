class CreateGuests < ActiveRecord::Migration[8.0]
  def change
    create_table :guests do |t|
      t.string :name
      t.string :email
      t.string :password_digest
      t.boolean :can_post_photos, default: false
      t.boolean :can_play_games, default: false
      t.boolean :can_read_journals, default: false
      t.string :invitation_token
      t.boolean :registered, default: false

      t.timestamps
    end
  end
end
