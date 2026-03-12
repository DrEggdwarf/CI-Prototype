class TeamChatChannel < ApplicationCable::Channel
  def subscribed
    stream_from "team_chat"
  end
end
