class WorkspaceController < ApplicationController
  before_action :authorize_workspace!

  def show
    member = Member.find(params[:member_id])
    controls = member.controls.includes(:comments, :attachments).order(due_date: :asc)
    todos = member.todos.ordered
    team_messages = TeamMessage.includes(:member).chronological.limit(100)
    all_members = Member.all

    render inertia: "Workspace", props: {
      member: member.as_json(only: [:id, :name, :initials, :color, :role, :load]),
      controls: controls.as_json(include: {
        comments: { only: [:id, :author, :body, :action_type, :created_at] },
        attachments: { only: [:id, :created_at], methods: [:file_url] }
      }),
      todos: todos.as_json(only: [:id, :content, :completed, :priority, :position, :tags, :created_at]),
      team_messages: team_messages.map { |msg|
        {
          id: msg.id,
          body: msg.body,
          created_at: msg.created_at,
          member: msg.member.as_json(only: [:id, :name, :initials, :color])
        }
      },
      all_members: all_members.as_json(only: [:id, :name, :initials, :color])
    }
  end

  private

  def authorize_workspace!
    unless current_member.admin? || current_member.id.to_s == params[:member_id].to_s
      redirect_to workspace_path(current_member), alert: "Accès refusé"
    end
  end
end
