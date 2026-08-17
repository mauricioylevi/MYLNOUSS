class CreateDailyJournals < ActiveRecord::Migration[8.1]
  def change
    create_table :daily_journals do |t|
      t.references :main_user, null: false, foreign_key: true
      t.date :date
      t.jsonb :entries

      t.timestamps
    end
  end
end
