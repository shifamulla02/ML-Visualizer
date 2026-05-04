const express = require('express');
const router = express.Router();
const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer') || {};
const auth = require('../middleware/auth');
const Dataset = require('../models/Dataset');

// In-memory preprocessing state per user session (in prod use Redis)
const preprocessState = {};

function parseCSV(filepath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filepath)
      .pipe(require('csv-parser')())
      .on('data', row => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

function getState(userId, datasetId) {
  const key = `${userId}_${datasetId}`;
  if (!preprocessState[key]) preprocessState[key] = { rows: null, steps: [], originalRows: null };
  return preprocessState[key];
}

router.post('/init', auth, async (req, res) => {
  try {
    const { datasetId } = req.body;
    const dataset = await Dataset.findOne({ _id: datasetId, userId: req.userId });
    if (!dataset) return res.status(404).json({ message: 'Dataset not found' });
    const rows = await parseCSV(dataset.filepath);
    const key = `${req.userId}_${datasetId}`;
    preprocessState[key] = { rows: JSON.parse(JSON.stringify(rows)), steps: [], originalRows: JSON.parse(JSON.stringify(rows)) };
    res.json({ message: 'Initialized', preview: rows.slice(0, 5), columns: dataset.columns });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/missing', auth, async (req, res) => {
  try {
    const { datasetId, column, strategy } = req.body;
    const state = getState(req.userId, datasetId);
    if (!state.rows) return res.status(400).json({ message: 'Initialize preprocessing first' });
    const before = JSON.parse(JSON.stringify(state.rows.slice(0, 5)));
    if (strategy === 'drop') {
      state.rows = state.rows.filter(row => row[column] !== '' && row[column] !== null && row[column] !== undefined);
    } else {
      const vals = state.rows.map(r => parseFloat(r[column])).filter(v => !isNaN(v));
      let fillVal;
      if (strategy === 'mean') fillVal = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3);
      else if (strategy === 'median') { const s = [...vals].sort((a, b) => a - b); fillVal = s[Math.floor(s.length / 2)]; }
      else if (strategy === 'mode') {
        const counts = {}; state.rows.forEach(r => { counts[r[column]] = (counts[r[column]] || 0) + 1; });
        fillVal = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
      }
      state.rows = state.rows.map(row => ({ ...row, [column]: row[column] === '' || row[column] == null ? fillVal : row[column] }));
    }
    state.steps.push({ type: 'missing', column, strategy, timestamp: new Date() });
    res.json({ message: `Applied ${strategy} on ${column}`, before, after: state.rows.slice(0, 5), steps: state.steps });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/encoding', auth, async (req, res) => {
  try {
    const { datasetId, column, method } = req.body;
    const state = getState(req.userId, datasetId);
    if (!state.rows) return res.status(400).json({ message: 'Initialize preprocessing first' });
    const before = JSON.parse(JSON.stringify(state.rows.slice(0, 5)));
    const uniqueVals = [...new Set(state.rows.map(r => r[column]))];
    if (method === 'label') {
      const labelMap = {};
      uniqueVals.forEach((v, i) => labelMap[v] = i);
      state.rows = state.rows.map(row => ({ ...row, [column]: labelMap[row[column]] }));
    } else if (method === 'onehot') {
      state.rows = state.rows.map(row => {
        const newRow = { ...row };
        delete newRow[column];
        uniqueVals.forEach(v => { newRow[`${column}_${v}`] = row[column] === v ? 1 : 0; });
        return newRow;
      });
    }
    state.steps.push({ type: 'encoding', column, method, timestamp: new Date() });
    res.json({ message: `Applied ${method} encoding on ${column}`, before, after: state.rows.slice(0, 5), steps: state.steps });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/scaling', auth, async (req, res) => {
  try {
    const { datasetId, column, method } = req.body;
    const state = getState(req.userId, datasetId);
    if (!state.rows) return res.status(400).json({ message: 'Initialize preprocessing first' });
    const before = JSON.parse(JSON.stringify(state.rows.slice(0, 5)));
    const vals = state.rows.map(r => parseFloat(r[column])).filter(v => !isNaN(v));
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const std = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
    const min = Math.min(...vals), max = Math.max(...vals);
    state.rows = state.rows.map(row => {
      const v = parseFloat(row[column]);
      if (isNaN(v)) return row;
      let scaled;
      if (method === 'standard') scaled = std !== 0 ? ((v - mean) / std).toFixed(4) : 0;
      else if (method === 'minmax') scaled = max !== min ? ((v - min) / (max - min)).toFixed(4) : 0;
      return { ...row, [column]: scaled };
    });
    state.steps.push({ type: 'scaling', column, method, timestamp: new Date() });
    res.json({ message: `Applied ${method} scaling on ${column}`, before, after: state.rows.slice(0, 5), steps: state.steps });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const { datasetId } = req.query;
    const state = getState(req.userId, datasetId);
    res.json({ steps: state.steps, preview: state.rows?.slice(0, 10) || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/undo', auth, async (req, res) => {
  try {
    const { datasetId } = req.body;
    const state = getState(req.userId, datasetId);
    state.steps.pop();
    res.json({ message: 'Last step undone', steps: state.steps });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/current-data', auth, async (req, res) => {
  try {
    const { datasetId } = req.query;
    const state = getState(req.userId, datasetId);
    res.json({ rows: state.rows || [], steps: state.steps });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
module.exports.getState = getState;
