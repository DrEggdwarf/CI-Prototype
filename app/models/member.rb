class Member < ApplicationRecord
  devise :database_authenticatable, :recoverable, :rememberable, :validatable

  has_many :controls, foreign_key: :assignee_id, dependent: :nullify, inverse_of: :assignee
  has_many :attachments, dependent: :destroy
  has_many :todos, dependent: :destroy
  has_many :team_messages, dependent: :destroy
  has_many :documents, foreign_key: :uploaded_by_id, dependent: :nullify

  validates :name, presence: true
  validates :role, presence: true
  validates :initials, presence: true, length: { maximum: 2 }
  validates :color, presence: true
  validates :load, presence: true, numericality: { only_integer: true, in: 0..100 }
  validates :email, presence: true, uniqueness: true

  def admin?
    admin
  end
end
