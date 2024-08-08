const express = require('express')
const router = express.Router()
const connectToDatabase = require('../models/db')

// Search for gifts
router.get('/', async (req, res, next) => {
  try {
    // Connect to the database
    const db = await connectToDatabase()
    const collection = db.collection('secondChanceItems')

    // Initialize the query object
    const query = {}

    // Add the name filter to the query if the name parameter is not empty
    if (req.query.name && req.query.name.trim() !== '') {
      query.name = { $regex: req.query.name, $options: 'i' } // Using regex for partial match, case-insensitive
    }
    // Add other filters to the query
    if (req.query.category) {
      query.category = req.query.category
    }
    if (req.query.condition) {
      query.condition = req.query.condition
    }
    if (req.query.age_years) {
      query.age_years = { $lte: parseInt(req.query.age_years) }
    }

    // Task 4: Fetch filtered items using the find(query) method
    const gifts = await collection.find(query).toArray()
    res.json(gifts)
  } catch (e) {
    next(e)
  }
})

module.exports = router
