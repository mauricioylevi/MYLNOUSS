class PublicController < ApplicationController
  layout "public"

  def site
    @photos = Photo.where(status: 'published').order(created_at: :desc)
  end
end
