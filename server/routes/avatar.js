const express = require('express')
const router = express.Router()
const axios = require('axios')

router.post('/session', async (req, res) => {
    try {
        const tokenRes = await axios.post(
        'https://api.liveavatar.com/v1/sessions/token',
        {
            mode: 'FULL',
            avatar_id: '65f9e3c9-d48b-4118-b73a-4ae2e3cbb8f0',
            avatar_persona: {
            context_id: '158f5d55-2d4f-11f1-8d28-066a7fa2e369',
            language: 'en'
            }
        },
        {
            headers: {
            'X-API-KEY': process.env.HEYGEN_API_KEY,
            'Content-Type': 'application/json'
            }
        }
        )

        const { session_token, session_id } = tokenRes.data.data

        const startRes = await axios.post(
        'https://api.liveavatar.com/v1/sessions/start',
        {},
        {
            headers: {
            'Authorization': `Bearer ${session_token}`,
            'Content-Type': 'application/json'
            }
        }
        )

        const { livekit_url, livekit_client_token } = startRes.data.data

        res.json({
        session_id,
        session_token,
        livekit_url,
        livekit_client_token
        })

    } catch (error) {
    console.error('HeyGen error:', error.response?.data || error.message)
    res.status(500).json({ error: 'Failed to create avatar session' })
}
})

module.exports = router