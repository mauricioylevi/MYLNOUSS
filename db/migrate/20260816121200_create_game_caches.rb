class CreateGameCaches < ActiveRecord::Migration[8.0]
  def change
    create_table :game_caches do |t|
      t.references :main_user, null: true, foreign_key: true
      t.string :game_type
      t.string :difficulty
      t.jsonb :payload

      t.timestamps
    end
    add_index :game_caches, [:main_user_id, :game_type, :difficulty], name: 'index_game_caches_on_user_and_type_and_diff'
  end
end
