const express = require('express')
const router = express.Router()
const axios = require('axios')

router.post('/', async (req, res) => {
  const { text } = req.body

  if (!text) {
    return res.status(400).json({ error: 'No text provided' })
  }

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM`,
      {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75
        }
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        responseType: 'arraybuffer'
      }
    )

    res.set('Content-Type', 'audio/mpeg')
    res.send(Buffer.from(response.data))

  } catch (error) {
    console.error('ElevenLabs error:', error.response?.data || error.message)
    res.status(500).json({ error: 'Failed to generate speech' })
  }
})

module.exports = router