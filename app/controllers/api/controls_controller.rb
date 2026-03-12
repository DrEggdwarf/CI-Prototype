module Api
  class ControlsController < BaseController
    before_action :set_control, only: [:update, :destroy]

    def index
      controls = Control.includes(:assignee, :pick).order(:name)
      render json: controls.as_json(
        include: {
          assignee: { only: [:id, :name, :initials, :color, :role] },
          pick: { only: [:id] }
        },
        methods: [:comments_count]
      )
    end

    def create
      control = Control.create!(control_params)
      render json: control.as_json(include: {
        assignee: { only: [:id, :name, :initials, :color, :role] }
      }), status: :created
    end

    def update
      @control.update!(control_params)
      render json: @control.as_json(include: {
        assignee: { only: [:id, :name, :initials, :color, :role] }
      })
    end

    def destroy
      @control.destroy!
      head :no_content
    end

    private

    def set_control
      @control = Control.find(params[:id])
    end

    def control_params
      params.expect(control: [:name, :domain, :criticality, :frequency, :due_date, :status, :pass_rate, :duration, :assignee_id])
    end
  end
end
