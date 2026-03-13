class CreateDocuments < ActiveRecord::Migration[8.1]
  def change
    create_table :documents do |t|
      t.string :name, null: false
      t.string :file_url
      t.string :file_type
      t.integer :file_size
      t.text :description
      t.references :uploaded_by, foreign_key: { to_table: :members }
      t.references :control, foreign_key: true, null: true
      t.boolean :shared, default: true

      t.timestamps
    end
  end
end
