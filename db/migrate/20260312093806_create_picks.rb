class CreatePicks < ActiveRecord::Migration[8.1]
  def change
    create_table :picks do |t|
      t.references :control, null: false, foreign_key: true, index: { unique: true }
      t.integer :score, null: false
      t.string :reason, null: false
      t.text :tags, null: false, default: "[]"

      t.timestamps
    end
  end
end
