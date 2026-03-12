class Comment < ApplicationRecord
  belongs_to :control

  validates :author, presence: true
  validates :action_type, presence: true
end
