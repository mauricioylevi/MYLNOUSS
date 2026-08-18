class AddAuthorTypeToPhotos < ActiveRecord::Migration[7.1]
  def change
    add_column :photos, :author_type, :string, default: 'Admin'
  end
end
