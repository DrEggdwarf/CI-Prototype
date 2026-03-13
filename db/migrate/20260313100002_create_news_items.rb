class CreateNewsItems < ActiveRecord::Migration[8.1]
  def change
    create_table :news_items do |t|
      t.string :title, null: false
      t.text :summary
      t.string :source_url
      t.string :source_name
      t.string :category
      t.json :tags, default: []
      t.datetime :published_at
      t.boolean :pinned, default: false

      t.timestamps
    end
  end
end
