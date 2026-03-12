class RiskSignal < ApplicationRecord
  self.table_name = "signals"

  SEVERITIES = %w[h m l].freeze

  validates :icon, presence: true
  validates :title, presence: true
  validates :description, presence: true
  validates :severity, presence: true, inclusion: { in: SEVERITIES }
end
