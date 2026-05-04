const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');
const FormData = require('form-data');
const auth = require('../middleware/auth');
const logger = require('../middleware/logger');
const { AppError } = require('../middleware/errorHandler');
const Dataset = require('../models/Dataset');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer for secure file uploads
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    // Sanitize filename to prevent path traversal
    const sanitized = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '')}`;
    cb(null, sanitized);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Only allow CSV files
    const allowedMimes = ['text/csv', 'application/csv'];
    const isCSV = allowedMimes.includes(file.mimetype) || file.originalname.endsWith('.csv');
    
    if (!isCSV) {
      logger.warn('Invalid file type attempted upload', {
        requestId: req.requestId,
        userId: req.userId,
        mimetype: file.mimetype,
        filename: file.originalname,
      });
      cb(new Error('Only CSV files are allowed'));
    } else {
      cb(null, true);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  }
});

/**
 * Parse CSV file and return array of rows
 * @param {string} filepath - Path to CSV file
 * @returns {Promise<Array>} Array of row objects
 */
function parseCSV(filepath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    const rowLimit = 100000; // Prevent memory exhaustion
    
    fs.createReadStream(filepath)
      .pipe(csv())
      .on('data', (row) => {
        if (rows.length >= rowLimit) {
          reject(new Error(`CSV file exceeds maximum row limit of ${rowLimit}`));
        }
        rows.push(row);
      })
      .on('end', () => resolve(rows))
      .on('error', (error) => reject(error));
  });
}

/**
 * Detect dataset type (classification, regression, etc.)
 */
function detectDatasetType(columns, rows) {
  const targetCandidates = ['target', 'label', 'class', 'category', 'species', 'type', 'output', 'y'];
  const hasTargetCol = targetCandidates.some(t => 
    columns.map(c => c.toLowerCase()).includes(t)
  );
  
  if (hasTargetCol) return 'classification';
  
  if (rows.length > 0) {
    const lastCol = columns[columns.length - 1];
    const lastColValues = rows.map(r => r[lastCol]);
    const uniqueValues = [...new Set(lastColValues)];
    if (uniqueValues.length <= 10) return 'classification';
    return 'regression';
  }
  
  return 'unknown';
}

/**
 * POST /api/dataset/upload
 * Upload a CSV dataset
 * Authentication required
 */
router.post('/upload', auth, upload.single('dataset'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded',
      });
    }

    logger.info('Dataset upload started', {
      requestId: req.requestId,
      userId: req.userId,
      filename: req.file.filename,
      size: req.file.size,
    });

    // Parse CSV
    const rows = await parseCSV(req.file.path);
    
    if (rows.length === 0) {
      fs.unlinkSync(req.file.path); // Clean up empty file
      return res.status(400).json({
        status: 'error',
        message: 'Dataset is empty',
      });
    }

    // Analyze dataset structure
    const columns = Object.keys(rows[0]);
    const datatypeSummary = {};
    const missingValues = {};

    columns.forEach(col => {
      let numericCount = 0;
      let missing = 0;

      rows.forEach(row => {
        const value = row[col];
        if (value === '' || value === null || value === undefined) {
          missing++;
        } else if (!isNaN(Number(value))) {
          numericCount++;
        }
      });

      datatypeSummary[col] = numericCount > rows.length * 0.7 ? 'numeric' : 'categorical';
      missingValues[col] = missing;
    });

    const datasetType = detectDatasetType(columns, rows);
    const preview = rows.slice(0, 10);

    // Create dataset record
    const dataset = await Dataset.create({
      userId: req.userId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filepath: req.file.path,
      columns,
      rows: rows.length,
      datatypeSummary,
      missingValues,
      datasetType,
      fileSize: req.file.size,
      preview,
    });

    logger.info('Dataset uploaded successfully', {
      requestId: req.requestId,
      userId: req.userId,
      datasetId: dataset._id,
      rows: rows.length,
    });

    res.status(201).json({
      status: 'success',
      message: 'Dataset uploaded successfully',
      data: { dataset },
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) logger.error('Failed to delete file after error', { error: err.message });
      });
    }

    logger.error('Dataset upload failed', {
      requestId: req.requestId,
      userId: req.userId,
      error: error.message,
    });

    next(error);
  }
});

/**
 * GET /api/dataset/list
 * List all datasets for the authenticated user
 */
router.get('/list', auth, async (req, res, next) => {
  try {
    const datasets = await Dataset.find({ userId: req.userId })
      .select('-preview') // Don't send preview by default for list view
      .sort({ uploadDate: -1 })
      .limit(100); // Prevent returning too many datasets

    logger.info('Dataset list retrieved', {
      requestId: req.requestId,
      userId: req.userId,
      count: datasets.length,
    });

    res.json({
      status: 'success',
      data: { datasets },
    });
  } catch (error) {
    logger.error('Failed to list datasets', {
      requestId: req.requestId,
      userId: req.userId,
      error: error.message,
    });
    next(error);
  }
});

/**
 * GET /api/dataset/:id
 * Get a specific dataset by ID
 */
router.get('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const dataset = await Dataset.findOne({
      _id: id,
      userId: req.userId,
    });

    if (!dataset) {
      logger.warn('Dataset not found', {
        requestId: req.requestId,
        userId: req.userId,
        datasetId: id,
      });
      return res.status(404).json({
        status: 'error',
        message: 'Dataset not found',
      });
    }

    logger.info('Dataset retrieved', {
      requestId: req.requestId,
      userId: req.userId,
      datasetId: id,
    });

    res.json({
      status: 'success',
      data: { dataset },
    });
  } catch (error) {
    logger.error('Failed to get dataset', {
      requestId: req.requestId,
      userId: req.userId,
      error: error.message,
    });
    next(error);
  }
});

/**
 * DELETE /api/dataset/:id
 * Delete a dataset
 */
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const dataset = await Dataset.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!dataset) {
      logger.warn('Dataset deletion failed - not found', {
        requestId: req.requestId,
        userId: req.userId,
        datasetId: id,
      });
      return res.status(404).json({
        status: 'error',
        message: 'Dataset not found',
      });
    }

    // Delete file from disk
    if (dataset.filepath && fs.existsSync(dataset.filepath)) {
      fs.unlinkSync(dataset.filepath);
    }

    logger.info('Dataset deleted', {
      requestId: req.requestId,
      userId: req.userId,
      datasetId: id,
    });

    res.json({
      status: 'success',
      message: 'Dataset deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete dataset', {
      requestId: req.requestId,
      userId: req.userId,
      error: error.message,
    });
    next(error);
  }
});

module.exports = router;

router.get('/:id', auth, async (req, res) => {
  try {
    const dataset = await Dataset.findOne({ _id: req.params.id, userId: req.userId });
    if (!dataset) return res.status(404).json({ message: 'Dataset not found' });
    res.json(dataset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/profile/:id', auth, async (req, res) => {
  try {
    const dataset = await Dataset.findOne({ _id: req.params.id, userId: req.userId });
    if (!dataset) return res.status(404).json({ message: 'Dataset not found' });
    const rows = await parseCSV(dataset.filepath);
    const columns = dataset.columns;
    const profile = { classDistribution: {}, numericStats: {}, categoricalStats: {}, correlations: [] };
    const lastCol = columns[columns.length - 1];
    if (dataset.datasetType === 'classification') {
      rows.forEach(row => {
        const val = row[lastCol];
        profile.classDistribution[val] = (profile.classDistribution[val] || 0) + 1;
      });
    }
    columns.forEach(col => {
      if (dataset.datatypeSummary.get ? dataset.datatypeSummary.get(col) === 'numeric' : dataset.datatypeSummary[col] === 'numeric') {
        const vals = rows.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const sorted = [...vals].sort((a, b) => a - b);
        profile.numericStats[col] = {
          mean: mean.toFixed(3),
          min: sorted[0],
          max: sorted[sorted.length - 1],
          median: sorted[Math.floor(sorted.length / 2)],
          std: Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length).toFixed(3),
          histogram: buildHistogram(vals)
        };
      } else {
        const counts = {};
        rows.forEach(r => { counts[r[col]] = (counts[r[col]] || 0) + 1; });
        profile.categoricalStats[col] = Object.entries(counts).slice(0, 10).map(([k, v]) => ({ name: k, value: v }));
      }
    });
    res.json({ dataset, profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function buildHistogram(vals, bins = 10) {
  if (!vals.length) return [];
  const min = Math.min(...vals), max = Math.max(...vals);
  const binSize = (max - min) / bins || 1;
  const histogram = Array(bins).fill(0).map((_, i) => ({ range: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`, count: 0 }));
  vals.forEach(v => {
    const idx = Math.min(Math.floor((v - min) / binSize), bins - 1);
    histogram[idx].count++;
  });
  return histogram;
}

module.exports = router;
