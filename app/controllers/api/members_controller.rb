module Api
  class MembersController < BaseController
    before_action :require_admin!, only: [:create, :destroy]
    before_action :set_member, only: [:update, :destroy]

    def index
      members = Member.order(:name)
      render json: members.as_json(only: [:id, :name, :initials, :color, :role, :load])
    end

    def create
      member = Member.create!(member_params)
      render json: member.as_json(only: [:id, :name, :initials, :color, :role, :load]), status: :created
    end

    def update
      @member.update!(member_params)
      render json: @member.as_json(only: [:id, :name, :initials, :color, :role, :load])
    end

    def destroy
      @member.destroy!
      head :no_content
    end

    private

    def set_member
      @member = Member.find(params[:id])
    end

    def member_params
      params.expect(member: [:name, :role, :initials, :color, :load, :email, :password, :admin])
    end
  end
end
