class ApplicationController < ActionController::Base
  allow_browser versions: :modern

  before_action :authenticate_member!
  before_action :set_locale

  inertia_share do
    if current_member
      {
        locale: I18n.locale.to_s,
        available_locales: I18n.available_locales.map(&:to_s),
        translations: app_translations,
        current_member_id: current_member.id,
        current_member: {
          id: current_member.id,
          name: current_member.name,
          email: current_member.email,
          role: current_member.role,
          initials: current_member.initials,
          color: current_member.color,
          admin: current_member.admin?
        },
        is_admin: current_member.admin?
      }
    else
      { locale: I18n.locale.to_s }
    end
  end

  private

  def require_admin!
    unless current_member&.admin?
      redirect_to workspace_path(current_member), alert: "Accès refusé"
    end
  end

  def set_locale
    locale = params[:locale] || session[:locale] || browser_locale
    I18n.locale = I18n.available_locales.map(&:to_s).include?(locale.to_s) ? locale : I18n.default_locale
    session[:locale] = I18n.locale
  end

  def browser_locale
    request.env["HTTP_ACCEPT_LANGUAGE"]&.scan(/[a-z]{2}/)&.first
  end

  # Load only our app-defined top-level keys (not Rails/AS internals)
  # Add your new locale top-level keys here when you extend config/locales/
  APP_LOCALE_KEYS = %w[app common nav auth criticality domains dashboard workspace settings dock].freeze

  def app_translations
    APP_LOCALE_KEYS.each_with_object({}) do |key, hash|
      result = I18n.t(key, locale: I18n.locale, default: nil)
      hash[key] = result if result
    end
  end
end
