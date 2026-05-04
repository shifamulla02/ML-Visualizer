const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const TrainingSession = require('../models/TrainingSession');

router.get('/history', auth, async (req, res) => {
  try {
    const sessions = await TrainingSession.find({ userId: req.userId }).sort({ createdAt: -1 }).populate('datasetId', 'originalName');
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/report/:id', auth, async (req, res) => {
  try {
    const session = await TrainingSession.findOne({ _id: req.params.id, userId: req.userId }).populate('datasetId');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await TrainingSession.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
