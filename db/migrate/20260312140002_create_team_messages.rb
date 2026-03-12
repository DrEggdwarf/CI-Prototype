class CreateTeamMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :team_messages do |t|
      t.references :member, null: false, foreign_key: true, index: true
      t.text :body, null: false

      t.timestamps
    end
  end
end
