const mongoose = require('mongoose');

const trainingSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  datasetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dataset', required: true },
  datasetName: { type: String },
  modelType: { type: String, required: true },
  targetColumn: { type: String, required: true },
  splitRatio: { type: String, default: '80-20' },
  metrics: { type: Object, default: {} },
  confusionMatrix: { type: Array, default: [] },
  featureImportance: { type: Array, default: [] },
  preprocessingSteps: { type: Array, default: [] },
  taskType: { type: String, enum: ['classification', 'regression'], default: 'classification' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TrainingSession', trainingSessionSchema);
