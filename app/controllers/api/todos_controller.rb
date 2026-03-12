module Api
  class TodosController < BaseController
    before_action :set_member
    before_action :set_todo, only: [:update, :destroy]

    def index
      todos = @member.todos.ordered

      render json: todos.as_json(only: [:id, :content, :completed, :priority, :position, :tags, :created_at])
    end

    def create
      todo = @member.todos.create!(todo_params)

      render json: todo.as_json(only: [:id, :content, :completed, :priority, :position, :tags, :created_at]),
             status: :created
    end

    def update
      @todo.update!(todo_params.merge(update_params))

      render json: @todo.as_json(only: [:id, :content, :completed, :priority, :position, :tags, :created_at])
    end

    def destroy
      @todo.destroy!

      head :no_content
    end

    def reorder
      ids = params.require(:ids)

      ActiveRecord::Base.transaction do
        ids.each_with_index do |id, index|
          @member.todos.where(id: id).update_all(position: index)
        end
      end

      render json: @member.todos.ordered.as_json(only: [:id, :content, :completed, :priority, :position, :tags, :created_at])
    end

    private

    def set_member
      @member = Member.find(params[:member_id])
    end

    def set_todo
      @todo = @member.todos.find(params[:id])
    end

    def todo_params
      params.require(:todo).permit(:content, :priority, :position, tags: [])
    end

    def update_params
      params.require(:todo).permit(:completed)
    end
  end
end
