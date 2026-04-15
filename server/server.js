const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.get('/', (req, res) => {
    res.json({ status: 'Sixth Sense backend running' })
})

app.use('/analyze', require('./routes/analyze'))
app.use('/speak', require('./routes/speak'))
app.use('/contacts', require('./routes/contacts'))
app.use('/avatar', require('./routes/avatar'))

app.listen(3001, () => {
    console.log(`Server running on port 3001`)
})