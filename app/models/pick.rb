class Pick < ApplicationRecord
  belongs_to :control

  serialize :tags, coder: JSON

  validates :score, presence: true, numericality: { only_integer: true }
  validates :reason, presence: true
  validates :tags, presence: true
  validates :control_id, uniqueness: true
end
