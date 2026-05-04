const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Dataset = require('../models/Dataset');
const fs = require('fs');
const csv = require('csv-parser');
const { getState } = require('./preprocess');

function parseCSV(filepath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filepath).pipe(csv()).on('data', r => rows.push(r)).on('end', () => resolve(rows)).on('error', reject);
  });
}

router.post('/train-test', auth, async (req, res) => {
  try {
    const { datasetId, ratio } = req.body;
    const dataset = await Dataset.findOne({ _id: datasetId, userId: req.userId });
    if (!dataset) return res.status(404).json({ message: 'Dataset not found' });
    const state = getState(req.userId, datasetId);
    let rows = state.rows;
    if (!rows || rows.length === 0) rows = await parseCSV(dataset.filepath);
    const trainPct = parseInt(ratio?.split('-')[0] || 80) / 100;
    const shuffled = [...rows].sort(() => Math.random() - 0.5);
    const splitIdx = Math.floor(shuffled.length * trainPct);
    const trainData = shuffled.slice(0, splitIdx);
    const testData = shuffled.slice(splitIdx);
    res.json({
      trainSize: trainData.length, testSize: testData.length, totalSize: rows.length,
      trainPreview: trainData.slice(0, 5), testPreview: testData.slice(0, 5),
      ratio, trainPct: trainPct * 100, testPct: (1 - trainPct) * 100
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
