# frozen_string_literal: true

module Api
  class DomainsController < BaseController
    before_action :require_admin!, only: [:create, :destroy]
    before_action :set_domain, only: [:update, :destroy]

    def index
      domains = Domain.ordered
      render json: domains.as_json(
        only: [:id, :name, :key, :color, :description, :position],
        methods: [:controls_count]
      )
    end

    def create
      domain = Domain.create!(domain_params)
      render json: domain.as_json(only: [:id, :name, :key, :color, :description, :position]), status: :created
    end

    def update
      @domain.update!(domain_params)
      render json: @domain.as_json(only: [:id, :name, :key, :color, :description, :position])
    end

    def destroy
      if @domain.destroy
        head :no_content
      else
        render json: { errors: @domain.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def set_domain
      @domain = Domain.find(params[:id])
    end

    def domain_params
      params.expect(domain: [:name, :key, :color, :description, :position])
    end
  end
end
