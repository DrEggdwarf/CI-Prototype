module Api
  class TeamMessagesController < BaseController
    def index
      messages = TeamMessage.includes(:member).chronological.limit(100)

      render json: messages.map { |msg|
        {
          id: msg.id,
          body: msg.body,
          created_at: msg.created_at,
          member: msg.member.as_json(only: [:id, :name, :initials, :color])
        }
      }
    end

    def create
      message = TeamMessage.create!(message_params)

      broadcast_data = {
        id: message.id,
        body: message.body,
        created_at: message.created_at,
        member: message.member.as_json(only: [:id, :name, :initials, :color])
      }

      ActionCable.server.broadcast("team_chat", broadcast_data)

      render json: broadcast_data, status: :created
    end

    private

    def message_params
      params.permit(:member_id, :body)
    end
  end
end
