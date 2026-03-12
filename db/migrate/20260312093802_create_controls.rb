class CreateControls < ActiveRecord::Migration[8.1]
  def change
    create_table :controls do |t|
      t.string :name, null: false
      t.string :domain, null: false
      t.string :criticality, null: false
      t.string :frequency, null: false
      t.integer :duration, null: false, default: 1
      t.date :due_date, null: false
      t.string :status, null: false, default: "pending"
      t.integer :pass_rate, null: false, default: 0
      t.references :assignee, foreign_key: { to_table: :members }, null: true

      t.timestamps
    end

    add_index :controls, :domain
    add_index :controls, :status
    add_index :controls, :due_date
  end
end
