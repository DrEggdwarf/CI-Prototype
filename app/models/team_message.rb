class TeamMessage < ApplicationRecord
  belongs_to :member

  validates :body, presence: true

  scope :recent, -> { order(created_at: :desc).limit(100) }
  scope :chronological, -> { order(created_at: :asc) }
end
