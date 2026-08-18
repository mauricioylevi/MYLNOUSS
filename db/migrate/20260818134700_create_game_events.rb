class CreateGameEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :game_events do |t|
      t.references :main_user, null: false, foreign_key: true
      t.string :game_name
      t.string :event_type

      t.timestamps
    end
  end
end
