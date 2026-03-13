class NewsItem < ApplicationRecord
  validates :title, presence: true
  validates :category, inclusion: { in: %w[juridique cyber rh finance interne general] }

  scope :recent, -> { order(published_at: :desc) }
  scope :pinned_first, -> { order(pinned: :desc, published_at: :desc) }
  scope :by_category, ->(cat) { where(category: cat) }
end
