class GameCache < ApplicationRecord
  belongs_to :main_user, optional: true
end
