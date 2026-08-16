class CreateCrosswordPuzzles < ActiveRecord::Migration[8.1]
  def change
    create_table :crossword_puzzles do |t|
      t.references :main_user, null: false, foreign_key: true
      t.string :difficulty
      t.jsonb :words_data

      t.timestamps
    end
  end
end
