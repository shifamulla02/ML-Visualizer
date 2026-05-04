const mongoose = require('mongoose');

const datasetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  filepath: { type: String, required: true },
  columns: [String],
  rows: { type: Number },
  datatypeSummary: { type: Map, of: String },
  missingValues: { type: Map, of: Number },
  datasetType: { type: String, enum: ['classification', 'regression', 'unknown'], default: 'unknown' },
  fileSize: { type: Number },
  preview: { type: Array, default: [] },
  profile: { type: Object, default: {} },
  uploadDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Dataset', datasetSchema);
