Rails.application.routes.draw do
  devise_for :members, controllers: { sessions: "members/sessions" }

  root "dashboard#index"
  get "workspace/:member_id", to: "workspace#show", as: :workspace
  get "settings", to: "settings#index"

  namespace :api do
    resources :controls, only: [:index, :create, :update, :destroy] do
      resources :comments, only: [:create]
      resources :attachments, only: [:create, :destroy]
    end
    resources :members, only: [:index, :create, :update, :destroy] do
      resources :todos, only: [:index, :create, :update, :destroy] do
        collection do
          patch :reorder
        end
      end
    end
    resources :domains, only: [:index, :create, :update, :destroy]
    resources :team_messages, only: [:index, :create]
  end

  get "up" => "rails/health#show", as: :rails_health_check
end
