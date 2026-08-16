class PhotosController < ApplicationController
  skip_before_action :verify_authenticity_token, only: [:create, :update, :destroy, :generate_audio]

  def index
    respond_to do |format|
      format.html do
        render :index
      end
      format.json do
        @photos = Photo.where(status: 'published').order(created_at: :desc)
        render json: @photos.map { |p| { id: p.id, description: p.description, url: p.image.attached? ? url_for(p.image) : nil } }
      end
    end
  end

  def drafts
    @photos = Photo.where(status: 'draft').order(created_at: :asc)
    render json: @photos.map { |p| { id: p.id, description: p.description, url: p.image.attached? ? url_for(p.image) : nil } }
  end

  def fingerprints
    # Return a list of all existing file fingerprints (filename-size) to prevent duplicates across sessions
    blobs = ActiveStorage::Blob.joins(:attachments).where(active_storage_attachments: { record_type: 'Photo' })
    fingerprints = blobs.map { |b| "#{b.filename}-#{b.byte_size}" }
    render json: fingerprints
  end

  def create
    @photo = Photo.new(status: 'draft')
    
    if params[:image].present?
      @photo.image.attach(params[:image])
    end

    if @photo.save
      render json: { success: true, photo: { id: @photo.id, url: @photo.image.attached? ? url_for(@photo.image) : nil } }
    else
      render json: { success: false, errors: @photo.errors.full_messages }, status: 422
    end
  end

  def update
    @photo = Photo.find(params[:id])
    if @photo.update(description: params[:description], status: 'published')
      render json: { success: true }
    else
      render json: { success: false, errors: @photo.errors.full_messages }, status: 422
    end
  end

  def destroy
    @photo = Photo.find(params[:id])
    if @photo.destroy
      render json: { success: true }
    else
      render json: { success: false }, status: 422
    end
  end

  def generate_audio
    @photo = Photo.find(params[:id])
    
    if @photo.audio.attached?
      render json: { success: true, url: url_for(@photo.audio) }
      return
    end

    text_to_read = @photo.description.present? ? @photo.description : "No description provided."
    
    audio_data = ElevenLabsService.text_to_speech(text_to_read)
    
    if audio_data
      @photo.audio.attach(
        io: StringIO.new(audio_data),
        filename: "audio_#{@photo.id}.mp3",
        content_type: 'audio/mpeg'
      )
      render json: { success: true, url: url_for(@photo.audio) }
    else
      render json: { success: false, error: "Failed to generate audio. Check API key." }, status: 500
    end
  end
end
