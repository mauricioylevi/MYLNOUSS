class DropCrosswordPuzzles < ActiveRecord::Migration[8.0]
  def up
    drop_table :crossword_puzzles
  end

  def down
    create_table :crossword_puzzles do |t|
      t.references :main_user, null: true, foreign_key: true
      t.jsonb :words_data
      t.string :difficulty

      t.timestamps
    end
  end
end
