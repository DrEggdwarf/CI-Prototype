class CreateSignals < ActiveRecord::Migration[8.1]
  def change
    create_table :signals do |t|
      t.string :icon, null: false
      t.string :title, null: false
      t.text :description, null: false
      t.string :severity, null: false

      t.timestamps
    end
  end
end
