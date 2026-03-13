class Members::SessionsController < Devise::SessionsController
  # Skip authentication for the login page itself
  skip_before_action :authenticate_member!, only: [:new, :create]

  # Affiche la page de login
  def new
    render inertia: "Auth/Login", props: { translations: app_translations }
  end

  # Gère le POST de login
  def create
    self.resource = warden.authenticate(auth_options)

    if resource
      sign_in(resource_name, resource)
      redirect_to after_sign_in_path_for(resource)
    else
      redirect_to new_member_session_path, inertia: { errors: { email: "Email ou mot de passe invalide" } }
    end
  end

  # Gère le DELETE de logout
  def destroy
    signed_out = (Devise.sign_out_all_scopes ? sign_out : sign_out(resource_name))
    redirect_to new_member_session_path
  end

  protected

  def after_sign_in_path_for(resource)
    if resource.admin?
      root_path
    else
      workspace_path(resource)
    end
  end

  def respond_to_on_destroy
    redirect_to new_member_session_path
  end
end
