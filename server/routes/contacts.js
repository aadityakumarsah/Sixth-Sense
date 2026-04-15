const express = require('express')
const router = express.Router()
const { MongoClient, ObjectId } = require('mongodb')

let client
let db

async function getDb() {
  console.log('MONGODB_URI:', process.env.MONGODB_URI)
  if (!db) {
    client = new MongoClient(process.env.MONGODB_URI, {
    tls: true,
    tlsAllowInvalidCertificates: true,
  })
    await client.connect()
    db = client.db('sixthsense')
  }
  return db
}

router.get('/', async (req, res) => {
  try {
    const db = await getDb()
    const contacts = await db.collection('contacts').find().toArray()
    res.json({ contacts })
  } catch (err) {
    console.error('MongoDB error:', err)
    res.status(500).json({ error: 'Failed to fetch contacts' })
  }
})

router.post('/', async (req, res) => {
  const { name, phone, email } = req.body
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone required' })
  }
  try {
    const db = await getDb()
    await db.collection('contacts').insertOne({ name, phone, email: email || '' })
    const contacts = await db.collection('contacts').find().toArray()
    res.json({ success: true, contacts })
  } catch (err) {
    console.error('MongoDB error:', err)
    res.status(500).json({ error: 'Failed to add contact' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb()
    await db.collection('contacts').deleteOne({ _id: new ObjectId(req.params.id) })
    const contacts = await db.collection('contacts').find().toArray()
    res.json({ success: true, contacts })
  } catch (err) {
    console.error('MongoDB error:', err)
    res.status(500).json({ error: 'Failed to delete contact' })
  }
})

router.post('/alert', async (req, res) => {
  try {
    const db = await getDb()
    const contacts = await db.collection('contacts').find().toArray()
    console.log('SOS ALERT triggered. Contacting:', contacts)
    res.json({ success: true, message: 'Emergency contacts alerted', contacted: contacts })
  } catch (err) {
    res.status(500).json({ error: 'Failed to alert contacts' })
  }
})

module.exports = router