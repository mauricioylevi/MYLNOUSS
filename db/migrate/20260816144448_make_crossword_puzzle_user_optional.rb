class MakeCrosswordPuzzleUserOptional < ActiveRecord::Migration[8.1]
  def change
    change_column_null :crossword_puzzles, :main_user_id, true
  end
end
