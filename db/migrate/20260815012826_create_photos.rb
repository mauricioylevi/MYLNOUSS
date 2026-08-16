class CreatePhotos < ActiveRecord::Migration[8.1]
  def change
    create_table :photos do |t|
      t.text :description

      t.timestamps
    end
  end
end
