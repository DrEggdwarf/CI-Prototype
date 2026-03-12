class AddDeviseToMembers < ActiveRecord::Migration[8.1]
  def change
    change_table :members do |t|
      ## Database authenticatable
      t.string :email, null: false, default: ""
      t.string :encrypted_password, null: false, default: ""

      ## Recoverable
      t.string :reset_password_token
      t.datetime :reset_password_sent_at

      ## Rememberable
      t.datetime :remember_created_at

      ## Admin flag
      t.boolean :admin, null: false, default: false
    end

    add_index :members, :email, unique: true
    add_index :members, :reset_password_token, unique: true
  end
end
