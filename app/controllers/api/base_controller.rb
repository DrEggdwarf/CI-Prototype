module Api
  class BaseController < ApplicationController
    skip_forgery_protection

    rescue_from ActiveRecord::RecordNotFound, with: :not_found
    rescue_from ActiveRecord::RecordInvalid, with: :unprocessable

    private

    def not_found
      render json: { error: "Not found" }, status: :not_found
    end

    def unprocessable(exception)
      render json: { errors: exception.record.errors.full_messages }, status: :unprocessable_entity
    end
  end
end
