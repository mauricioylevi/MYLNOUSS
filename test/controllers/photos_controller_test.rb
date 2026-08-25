require "test_helper"

class PhotosControllerTest < ActionDispatch::IntegrationTest
  setup do
    @photo = Photo.create!(status: 'published', description: 'Test Photo', author_type: 'Admin')
    @draft = Photo.create!(status: 'draft', description: 'Draft Photo', author_type: 'Admin')
  end

  test "should get index json" do
    get photos_url(format: :json)
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_equal 1, json_response.length
    assert_equal "Test Photo", json_response.first["description"]
  end

  test "should get drafts" do
    get drafts_photos_url
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_equal 1, json_response.length
    assert_equal "Draft Photo", json_response.first["description"]
  end

  test "should get fingerprints" do
    get fingerprints_photos_url
    assert_response :success
  end

  test "should create photo" do
    assert_difference("Photo.count") do
      post photos_url, params: {}
    end
    assert_response :success
    json_response = JSON.parse(response.body)
    assert json_response['success']
    assert_equal 'draft', Photo.last.status
  end

  test "should update photo to published" do
    patch photo_url(@draft), params: { description: 'Updated' }
    assert_response :success
    @draft.reload
    assert_equal 'published', @draft.status
    assert_equal 'Updated', @draft.description
  end

  test "should destroy photo" do
    assert_difference("Photo.count", -1) do
      delete photo_url(@photo)
    end
    assert_response :success
  end

  test "should generate audio" do
    ElevenLabsService.stubs(:text_to_speech).returns("fake_audio_data")
    
    post generate_audio_photo_url(@photo)
    assert_response :success
    json_response = JSON.parse(response.body)
    assert json_response['success']
    
    @photo.reload
    assert @photo.audio.attached?
  end
end
