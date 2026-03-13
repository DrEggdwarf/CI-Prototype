class Control < ApplicationRecord
  CRITICALITIES = %w[critical high medium low].freeze
  STATUSES = %w[pending in_progress overdue done].freeze
  FREQUENCIES = %w[daily weekly monthly quarterly yearly].freeze

  belongs_to :assignee, class_name: "Member", optional: true
  belongs_to :domain_record, class_name: "Domain", foreign_key: :domain, primary_key: :key, optional: true, inverse_of: :controls
  has_many :comments, dependent: :destroy
  has_many :attachments, dependent: :destroy
  has_one :pick, dependent: :destroy

  def comments_count
    comments.size
  end

  validates :name, presence: true
  validates :domain, presence: true, inclusion: { in: -> { Domain.pluck(:key) } }
  validates :criticality, presence: true, inclusion: { in: CRITICALITIES }
  validates :frequency, presence: true, inclusion: { in: FREQUENCIES }
  validates :due_date, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :pass_rate, presence: true, numericality: { only_integer: true, in: 0..100 }
  validates :duration, presence: true, numericality: { only_integer: true, greater_than: 0 }
end
