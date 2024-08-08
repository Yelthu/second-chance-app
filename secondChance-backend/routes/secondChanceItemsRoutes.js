const express = require('express')
const multer = require('multer')
const router = express.Router()
const connectToDatabase = require('../models/db')
const logger = require('../logger')

// Define the upload directory path
const directoryPath = 'public/images'

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath) // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) // Use the original file name
  }
})

const upload = multer({ storage })

router.use(express.json())

// Get all secondChanceItems
router.get('/', async (req, res, next) => {
  logger.info('/ called')
  try {
    // Connect to MongoDB
    const db = await connectToDatabase()
    // Retrieve the secondChanceItems collection
    const collection = db.collection('secondChanceItems')
    // Fetch all secondChanceItems
    const secondChanceItems = await collection.find({}).toArray()
    // Return secondChanceItems
    res.json(secondChanceItems)
  } catch (e) {
    logger.console.error('oops something went wrong', e)
    next(e)
  }
})

// Add a new item
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    // Retrieve the database connection
    const db = await connectToDatabase()
    // Retrieve the secondChanceItems collection
    const collection = db.collection('secondChanceItems')
    // Create a new secondChanceItem
    let secondChanceItem = req.body
    // Set the new item's ID
    const lastItemQuery = collection.find().sort({ id: '-1' }).limit(1)
    await lastItemQuery.forEach(item => {
      secondChanceItem.id = (parseInt(item.id) + 1).toString()
    })
    // Set the current date to the new item
    const dateAdded = Math.floor(new Date().getTime() / 1000)
    secondChanceItem.dateAdded = dateAdded
    // Add the new item to the database
    secondChanceItem = await collection.insertOne(secondChanceItem)
    res.status(201).send('Item added successfully')
  } catch (e) {
    next(e)
  }
})

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
  try {
    // Retrieve database connection
    const db = await connectToDatabase()
    // Retrieve the secondChanceItems collection
    const collection = db.collection('secondChanceItems')
    // Find a specific item by ID
    const id = req.params.id
    const secondChanceItem = await collection.findOne({ id })
    // Return the secondChanceItem as a JSON object
    if (!secondChanceItem) {
      return res.status(404).send('secondChanceItem not found')
    }
    res.status(200).json(secondChanceItem)
  } catch (e) {
    next(e)
  }
})

// Update and existing item
router.put('/:id', async (req, res, next) => {
  try {
    // Retrieve the database connection
    const db = await connectToDatabase()
    // Retrieve the secondChanceItems collection
    const collection = db.collection('secondChanceItems')
    // Check if the secondChanceItem exists
    const id = req.params.id
    const secondChanceItem = await collection.findOne({ id })
    if (!secondChanceItem) {
      logger.error('secondChanceItem not found')
      return res.status(404).json({ error: 'secondChanceItem not found' })
    }
    // Update the item's attributes
    secondChanceItem.category = req.body.category
    secondChanceItem.condition = req.body.condition
    secondChanceItem.age_days = req.body.age_days
    secondChanceItem.description = req.body.description
    secondChanceItem.age_years = Number((secondChanceItem.age_days / 365).toFixed(1))
    secondChanceItem.updatedAt = new Date()

    const updatepreloveItem = await collection.findOneAndUpdate(
      { id },
      { $set: secondChanceItem },
      { returnDocument: 'after' }
    )
    // Send a confirmation
    if (updatepreloveItem) {
      res.json({ uploaded: 'success' })
    } else {
      res.json({ uploaded: 'failed' })
    }
  } catch (e) {
    next(e)
  }
})

// Delete an existing item
router.delete('/:id', async (req, res, next) => {
  try {
    // Retrieve the database connection
    const db = await connectToDatabase()
    // Retrieve the secondChanceItems collection
    const collection = db.collection('secondChanceItems')
    // Find a specific secondChanceItem by ID
    const id = req.params.id
    const secondChanceItem = await collection.findOne({ id })
    if (!secondChanceItem) {
      logger.error('secondChanceItem not found')
      return res.status(404).json({ error: 'secondChanceItem not found' })
    }
    // Delete the object and send an appropriate message
    await collection.deleteOne({ id })
    res.json({ deleted: 'success' })
  } catch (e) {
    next(e)
  }
})

module.exports = router
