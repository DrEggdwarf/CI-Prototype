module Api
  class NewsItemsController < BaseController
    def index
      news_items = NewsItem.all

      news_items = news_items.by_category(params[:category]) if params[:category].present?

      if params[:tag].present?
        # JSON column search — works with both SQLite (json_each) and PostgreSQL (@>)
        if ActiveRecord::Base.connection.adapter_name == "PostgreSQL"
          news_items = news_items.where("tags @> ?", [params[:tag]].to_json)
        else
          news_items = news_items.where("EXISTS (SELECT 1 FROM json_each(tags) WHERE value = ?)", params[:tag])
        end
      end

      render json: news_items.pinned_first.as_json
    end
  end
end
