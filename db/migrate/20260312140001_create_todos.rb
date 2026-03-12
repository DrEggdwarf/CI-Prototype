class CreateTodos < ActiveRecord::Migration[8.1]
  def change
    create_table :todos do |t|
      t.references :member, null: false, foreign_key: true, index: true
      t.text :content, null: false
      t.boolean :completed, null: false, default: false
      t.string :priority, null: false, default: "medium"
      t.integer :position, null: false, default: 0
      t.text :tags, default: "[]"

      t.timestamps
    end
  end
end
