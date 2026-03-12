class Todo < ApplicationRecord
  belongs_to :member

  validates :content, presence: true
  validates :priority, presence: true, inclusion: { in: %w[low medium high] }
  validates :position, presence: true, numericality: { only_integer: true }

  scope :ordered, -> { order(:completed, :position, :created_at) }
  scope :active, -> { where(completed: false) }

  def parsed_tags
    JSON.parse(tags || "[]")
  end
end
