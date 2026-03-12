class CreateMembers < ActiveRecord::Migration[8.1]
  def change
    create_table :members do |t|
      t.string :name, null: false
      t.string :role, null: false
      t.string :initials, null: false
      t.string :color, null: false
      t.integer :load, null: false, default: 0

      t.timestamps
    end
  end
end
