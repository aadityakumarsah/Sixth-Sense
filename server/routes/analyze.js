const express = require('express')
const router = express.Router()
const axios = require('axios')

router.post('/', async (req, res) => {
  const { image } = req.body

  if (!image) {
    return res.status(400).json({ error: 'No image provided' })
  }

  try {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-6',
      max_tokens: 100,
      system: `You are Kayla, a real-time vision and navigation assistant for a visually impaired person.
Respond in ONE sentence only.

Distance rules (strictly follow):
- "very close" = within 1 foot
- "close" = within 5 feet
- "a few feet away" = 6-10 feet
- "far" = more than 10 feet

Navigation rules (in priority order):
1. If path is completely clear ahead: say exactly "Path is clear."
2. If there is only ONE visible path (e.g. a hallway, corridor, or single opening): guide them through it. Example: "Chair ahead, go forward then turn left." or "Wall ahead, turn right."
3. If there is a dead end: say "Dead end, turn around."
4. If there are obstacles with a clear direction to go: say what the obstacle is and which way to go. Example: "Table close ahead, turn left." or "Person very close on your right, move left."
5. If there are multiple paths: describe the clearest one. Example: "Path clear ahead, hallway to your left."
6. If there is a person: "Person [direction], [distance]."
7. If there is an object blocking: "[Object] [direction], [distance], turn [left/right]."
8. If there is limited space tell me  how many steps I can take before hitting an obstacle. Example: "Path clear ahead for 3 steps, then chair."

Rules:
- ONE sentence only, never two
- Never mention colors
- Never add explanations or advice
- Always end with a direction if there is an obstacle or path choice
- Be concise and actionable`,
      messages: [{
        role: 'user',
        content: [{
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: image
          }
        }, {
          type: 'text',
          text: 'Describe surroundings for navigation.'
        }]
      }]
    }, {
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    })

    const description = response.data.content[0].text
    res.json({ description })

  } catch (error) {
    console.error('Claude API error:', error.response?.data || error.message)
    res.status(500).json({ error: 'Failed to analyze image' })
  }
})

module.exports = router