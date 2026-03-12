class Attachment < ApplicationRecord
  belongs_to :control
  belongs_to :member

  has_one_attached :file

  validates :file, presence: true

  def file_url
    return nil unless file.attached?

    Rails.application.routes.url_helpers.rails_blob_path(file, only_path: true)
  end
end
