require 'net/http'
require 'uri'
require 'json'

class ElevenLabsService
  # Default Voice ID (Rachel)
  DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"
  
  def self.text_to_speech(text)
    api_key = ENV['ELEVENLABS_API_KEY']
    unless api_key.present?
      Rails.logger.error("ElevenLabs API Key is missing. Set ELEVENLABS_API_KEY environment variable.")
      return nil
    end

    uri = URI("https://api.elevenlabs.io/v1/text-to-speech/#{DEFAULT_VOICE_ID}")
    
    req = Net::HTTP::Post.new(uri)
    req['xi-api-key'] = api_key
    req['Content-Type'] = 'application/json'
    req['Accept'] = 'audio/mpeg'
    
    req.body = {
      text: text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    }.to_json

    res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
      http.request(req)
    end
    
    if res.is_a?(Net::HTTPSuccess)
      return res.body
    else
      Rails.logger.error("ElevenLabs API Error: #{res.code} - #{res.body}")
      return nil
    end
  end
end
