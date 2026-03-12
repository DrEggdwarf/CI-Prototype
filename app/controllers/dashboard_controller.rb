class DashboardController < ApplicationController
  before_action :require_admin!

  def index
    controls = Control.includes(:assignee, :pick).order(due_date: :asc)
    members = Member.order(:name)
    signals = RiskSignal.order(severity: :asc)
    picks = Pick.includes(:control).order(score: :desc)

    render inertia: "Dashboard", props: {
      controls: controls.as_json(include: {
        assignee: { only: [:id, :name, :initials, :color, :role] },
        pick: { only: [:id, :score, :reason, :tags] }
      }),
      members: members.as_json(only: [:id, :name, :initials, :color, :role, :load]),
      signals: signals.as_json(only: [:id, :icon, :title, :description, :severity]),
      picks: picks.as_json(include: {
        control: { only: [:id, :name, :domain] }
      })
    }
  end
end
