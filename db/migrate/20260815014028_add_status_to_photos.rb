class AddStatusToPhotos < ActiveRecord::Migration[8.1]
  def change
    add_column :photos, :status, :string
  end
end
