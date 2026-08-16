class Photo < ApplicationRecord
  has_one_attached :image
  has_one_attached :audio

  after_initialize :set_default_status, if: :new_record?

  def set_default_status
    self.status ||= 'draft'
  end
end
