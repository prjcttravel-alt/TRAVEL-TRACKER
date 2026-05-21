const express = require('express');
const router = express.Router();
const Search = require('../models/Search');

// POST /api/search/track  — upsert a search keyword (increment frequency)
router.post('/track', async (req, res) => {
  try {
    const { keyword } = req.body;
    if (!keyword || keyword.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Keyword too short' });
    }

    const normalised = keyword.trim().toLowerCase();

    const record = await Search.findOneAndUpdate(
      { keyword: normalised },
      { $inc: { frequency: 1 }, $set: { lastSearched: new Date() } },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
