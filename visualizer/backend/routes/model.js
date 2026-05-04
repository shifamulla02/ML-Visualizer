const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const auth = require('../middleware/auth');
const Dataset = require('../models/Dataset');
const TrainingSession = require('../models/TrainingSession');
const { getState } = require('./preprocess');

const ML_SERVICE = process.env.ML_SERVICE_URL || 'http://localhost:8000';

router.post('/train', auth, async (req, res) => {
  try {
    const { datasetId, targetColumn, modelType, splitRatio, preprocessingSteps } = req.body;
    const dataset = await Dataset.findOne({ _id: datasetId, userId: req.userId });
    if (!dataset) return res.status(404).json({ message: 'Dataset not found' });
    const state = getState(req.userId, datasetId);
    let dataToSend;
    if (state.rows && state.rows.length > 0) {
      dataToSend = JSON.stringify(state.rows);
    }
    const payload = {
      filepath: dataset.filepath,
      target_column: targetColumn,
      model_type: modelType,
      split_ratio: splitRatio || '80-20',
      preprocessing_steps: preprocessingSteps || state.steps || [],
      inline_data: dataToSend || null
    };
    const mlResponse = await axios.post(`${ML_SERVICE}/train-model`, payload, { timeout: 60000 });
    const result = mlResponse.data;
    const session = await TrainingSession.create({
      userId: req.userId, datasetId, datasetName: dataset.originalName,
      modelType, targetColumn, splitRatio: splitRatio || '80-20',
      metrics: result.metrics, confusionMatrix: result.confusion_matrix || [],
      featureImportance: result.feature_importance || [],
      preprocessingSteps: state.steps || [],
      taskType: result.task_type || 'classification'
    });
    res.json({ session, result });
  } catch (err) {
    if (err.code === 'ECONNREFUSED') return res.status(503).json({ message: 'ML service unavailable. Please start the Python FastAPI service.' });
    res.status(500).json({ message: err.response?.data?.detail || err.message });
  }
});

router.get('/metrics/:sessionId', auth, async (req, res) => {
  try {
    const session = await TrainingSession.findOne({ _id: req.params.sessionId, userId: req.userId });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/compare', auth, async (req, res) => {
  try {
    const { sessionIds } = req.body;
    const sessions = await TrainingSession.find({ _id: { $in: sessionIds }, userId: req.userId });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
