class SettingsController < ApplicationController
  before_action :require_admin!

  def index
    members = Member.order(:name)
    domains = Domain.ordered
    controls = Control.includes(:assignee).order(:name)
    todos = Todo.includes(:member).ordered

    render inertia: "Settings", props: {
      members: members.as_json(only: [:id, :name, :initials, :color, :role, :load]),
      domains: domains.as_json(only: [:id, :name, :key, :color, :description, :position]),
      controls: controls.as_json(include: {
        assignee: { only: [:id, :name] }
      }),
      todos: todos.as_json(only: [:id, :content, :completed, :priority, :position, :tags, :created_at, :member_id])
    }
  end
end
