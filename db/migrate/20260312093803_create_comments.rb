class CreateComments < ActiveRecord::Migration[8.1]
  def change
    create_table :comments do |t|
      t.references :control, null: false, foreign_key: true
      t.string :author, null: false
      t.string :action_type, null: false
      t.text :body
      t.text :ai_question
      t.text :ai_answer

      t.timestamps
    end
  end
end
