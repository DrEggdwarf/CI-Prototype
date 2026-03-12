module Api
  class AttachmentsController < BaseController
    before_action :set_control

    def create
      attachment = @control.attachments.create!(attachment_params)
      render json: attachment.as_json(only: [:id, :created_at], methods: [:file_url]), status: :created
    end

    def destroy
      attachment = @control.attachments.find(params[:id])
      attachment.file.purge
      attachment.destroy!
      head :no_content
    end

    private

    def set_control
      @control = Control.find(params[:control_id])
    end

    def attachment_params
      params.expect(attachment: [:file, :member_id])
    end
  end
end
