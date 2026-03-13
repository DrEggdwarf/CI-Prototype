module Api
  class DocumentsController < BaseController
    before_action :set_document, only: [:destroy]

    def index
      documents = Document.includes(:uploaded_by, :control)

      documents = documents.where(control_id: params[:control_id]) if params[:control_id].present?
      documents = documents.where(shared: params[:shared] == "true") if params[:shared].present?

      render json: documents.order(created_at: :desc).as_json(
        include: {
          uploaded_by: { only: [:id, :name, :initials, :color] },
          control: { only: [:id, :name, :domain] }
        }
      )
    end

    def create
      document = Document.create!(document_params.merge(uploaded_by_id: current_member.id))
      render json: document.as_json(
        include: {
          uploaded_by: { only: [:id, :name, :initials, :color] },
          control: { only: [:id, :name, :domain] }
        }
      ), status: :created
    end

    def destroy
      @document.destroy!
      head :no_content
    end

    private

    def set_document
      @document = Document.find(params[:id])
    end

    def document_params
      params.expect(document: [:name, :file_url, :file_type, :file_size, :description, :control_id, :shared])
    end
  end
end
