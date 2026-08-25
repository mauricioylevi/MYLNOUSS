require "test_helper"

class ElevenLabsServiceTest < ActiveSupport::TestCase
  test "returns nil when ELEVENLABS_API_KEY is missing" do
    ENV.stub(:[], nil) do
      result = ElevenLabsService.text_to_speech("Hello")
      assert_nil result
    end
  end

  test "makes http request when ELEVENLABS_API_KEY is present" do
    ENV.stub(:[], "fake_key") do
      mock_response = Net::HTTPSuccess.new(1.0, "200", "OK")
      mock_response.stubs(:body).returns("audio_bytes")
      
      Net::HTTP.stubs(:start).returns(mock_response)
      
      result = ElevenLabsService.text_to_speech("Hello world")
      assert_equal "audio_bytes", result
    end
  end
end
