# frozen_string_literal: true

class Domain < ApplicationRecord
  has_many :controls, foreign_key: :domain, primary_key: :key, dependent: :restrict_with_error, inverse_of: :domain_record

  def controls_count
    controls.size
  end

  validates :name, presence: true, uniqueness: true
  validates :key, presence: true, uniqueness: true
  validates :color, presence: true
  validates :position, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :ordered, -> { order(:position, :name) }
end
