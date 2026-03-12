module Api
  class CommentsController < BaseController
    before_action :set_control

    def create
      comment = @control.comments.create!(comment_params)
      render json: comment.as_json(only: [:id, :author, :body, :action_type, :created_at]), status: :created
    end

    private

    def set_control
      @control = Control.find(params[:control_id])
    end

    def comment_params
      params.expect(comment: [:author, :body, :action_type])
    end
  end
end
