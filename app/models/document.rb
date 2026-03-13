class Document < ApplicationRecord
  belongs_to :uploaded_by, class_name: "Member"
  belongs_to :control, optional: true

  validates :name, presence: true
  validates :file_type, inclusion: { in: %w[pdf xlsx docx pptx image other] }
end
