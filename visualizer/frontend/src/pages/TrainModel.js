import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { modelAPI } from '../services/api';
import { useDataset } from '../context/DatasetContext';
import { useNavigate } from 'react-router-dom';
import AlgoVisualizer from '../components/AlgoVisualizer';
import LearningModule from './LearningModule';

const MODELS = [
  { id: 'decision_tree', label: 'Decision Tree', desc: 'Rule-based classifier', icon: '⬡', type: 'classification' },
  { id: 'knn', label: 'K-Nearest Neighbors', desc: 'Distance-based classifier', icon: '◉', type: 'classification' },
  { id: 'random_forest', label: 'Random Forest', desc: 'Ensemble of trees', icon: '⬟', type: 'classification' },
  { id: 'linear_regression', label: 'Linear Regression', desc: 'Continuous output predictor', icon: '⧊', type: 'regression' },
];

const RATIOS = ['70-30', '80-20', '90-10'];

export default function TrainModel() {
  const { selectedDataset, preprocessSteps, setLastTrainingResult } = useDataset();
  const [model, setModel] = useState('decision_tree');
  const [target, setTarget] = useState('');
  const [ratio, setRatio] = useState('80-20');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activePageTab, setActivePageTab] = useState('train');
  const [visualizerState, setVisualizerState] = useState(null);
  const navigate = useNavigate();

  const train = async () => {
    if (!selectedDataset) { toast.error('Select a dataset first'); return; }
    if (!target) { toast.error('Select target column'); return; }
    setLoading(true);
    setVisualizerState({ model, keyTime: Date.now() });
    try {
      const { data } = await modelAPI.train({
        datasetId: selectedDataset._id,
        targetColumn: target,
        modelType: model,
        splitRatio: ratio,
        preprocessingSteps: preprocessSteps
      });
      // Add minimum delay to allow for the visualizer animation to complete its steps
      await new Promise(r => setTimeout(r, 4500));
      
      setResult(data);
      setLastTrainingResult(data);
      toast.success('Model trained successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Training failed. Ensure ML service is running.');
    } finally {
      setLoading(false);
    }
  };

  const columns = Array.isArray(selectedDataset?.columns) ? selectedDataset.columns : [];
  const datasetType = selectedDataset?.datasetType;
  const availableModels = MODELS; // Always show all models so user can see Linear Regression

  if (!selectedDataset) return (
    <div className="text-center py-20" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <p className="text-violet-400 text-4xl mb-4">⬟</p>
      <p className="text-violet-300 text-sm">Select a dataset first</p>
    </div>
  );

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <h1 className="text-xl font-bold text-violet-100 mb-1">Train Model & Learn</h1>
      <p className="text-violet-500 text-xs mb-6">{selectedDataset.originalName} · {datasetType}</p>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-violet-900/30 mb-6">
        <button 
          onClick={() => setActivePageTab('train')}
          className={`px-4 py-2 text-sm font-semibold transition-all ${activePageTab === 'train' ? 'text-violet-300 border-b-2 border-violet-500 bg-violet-900/10' : 'text-violet-600 hover:text-violet-400'}`}>
          Train Model
        </button>
        <button 
          onClick={() => setActivePageTab('visualizer')}
          className={`px-4 py-2 text-sm font-semibold transition-all ${activePageTab === 'visualizer' ? 'text-violet-300 border-b-2 border-violet-500 bg-violet-900/10' : 'text-violet-600 hover:text-violet-400'}`}>
          Interactive Visualizer
        </button>
        <button 
          onClick={() => setActivePageTab('quiz')}
          className={`px-4 py-2 text-sm font-semibold transition-all ${activePageTab === 'quiz' ? 'text-violet-300 border-b-2 border-pink-500 bg-pink-900/10' : 'text-pink-600 hover:text-pink-400'}`}>
          ► Quizzes & Concept Explorer
        </button>
      </div>

      {activePageTab === 'train' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Model selection */}
        <div className="col-span-2 bg-gray-900/40 border border-violet-900/20 rounded-xl p-4">
          <h2 className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-3">Select Algorithm</h2>
          <div className="grid grid-cols-2 gap-2">
            {availableModels.map(m => (
              <button key={m.id} onClick={() => setModel(m.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  model === m.id
                    ? 'border-violet-500 bg-violet-900/30 text-violet-200'
                    : 'border-violet-900/20 text-violet-500 hover:border-violet-700/40'
                }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{m.icon}</span>
                  <span className="text-xs font-medium">{m.label}</span>
                </div>
                <p className="text-xs opacity-60">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Config */}
        <div className="bg-gray-900/40 border border-violet-900/20 rounded-xl p-4">
          <h2 className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-3">Configuration</h2>
          <div className="space-y-3">
            <div>
              <label className="text-violet-500 text-xs uppercase tracking-wider block mb-1">Target Column</label>
              <select value={target} onChange={e => setTarget(e.target.value)}
                className="w-full bg-slate-900 border border-violet-800/30 rounded-lg px-3 py-2 text-violet-200 text-xs focus:outline-none focus:border-violet-500">
                <option value="">Select target...</option>
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-violet-500 text-xs uppercase tracking-wider block mb-1">Split Ratio</label>
              <div className="grid grid-cols-3 gap-1">
                {RATIOS.map(r => (
                  <button key={r} onClick={() => setRatio(r)}
                    className={`py-1.5 rounded text-xs transition-all ${ratio === r ? 'bg-violet-600 text-white' : 'bg-slate-900 text-violet-500 hover:text-violet-300'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            {preprocessSteps.length > 0 && (
              <div className="p-2 bg-violet-900/20 rounded border border-violet-800/20">
                <p className="text-violet-400 text-xs">{preprocessSteps.length} preprocessing steps will be applied</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <button onClick={train} disabled={loading || !target}
        className="w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white py-4 rounded-xl text-sm font-bold disabled:opacity-40 transition-all mb-6 relative">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            Training {MODELS.find(m => m.id === model)?.label}...
          </span>
        ) : `Train ${MODELS.find(m => m.id === model)?.label} →`}
      </button>

      {visualizerState && (
        <div className="bg-gray-900/40 border border-violet-500/30 rounded-xl overflow-hidden mb-6">
          <AlgoVisualizer 
            key={visualizerState.keyTime}
            standaloneAlgo={
              visualizerState.model === 'decision_tree' ? 'dt' : 
              visualizerState.model === 'knn' ? 'knn' : 
              visualizerState.model === 'random_forest' ? 'rf' : 
              'lr'
            } 
            isTraining={true} 
          />
        </div>
      )}

      {result && !loading && (
        <div className="bg-gray-900/40 border border-violet-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-violet-300 text-sm font-semibold">Training Complete ✓</h2>
            <button onClick={() => navigate('/metrics')}
              className="text-violet-400 hover:text-violet-200 text-xs border border-violet-700/30 px-3 py-1.5 rounded-lg">
              View Full Metrics →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(result.result?.metrics || {}).map(([k, v]) => (
              <div key={k} className="bg-violet-900/20 rounded-lg p-3">
                <p className="text-violet-500 text-xs capitalize">{k.replace(/_/g, ' ')}</p>
                <p className="text-violet-200 text-xl font-bold mt-1">
  {typeof v === "number"
    ? (
        (k === "mse" || k === "mae" || k === "rmse"
          ? v
          : v * 100
        ).toFixed(k === "mse" || k === "mae" ? 2 : 1)
      )
    : v}
  {k !== "mse" && k !== "mae" && k !== "rmse" ? "%" : ""}
</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <p className="text-violet-500">Train samples: <span className="text-violet-300">{result.result?.train_size}</span></p>
            <p className="text-violet-500">Test samples: <span className="text-violet-300">{result.result?.test_size}</span></p>
          </div>
        </div>
      )}
      </>
      )}

      {activePageTab === 'visualizer' && (
        <div className="bg-gray-900/10 border border-violet-900/20 rounded-xl overflow-hidden shadow-xl -mx-4 sm:mx-0">
          <AlgoVisualizer />
        </div>
      )}

      {activePageTab === 'quiz' && (
        <div className="bg-gray-900/10 border border-violet-900/20 rounded-xl overflow-hidden shadow-xl -mx-4 sm:mx-0 relative">
          <LearningModule />
        </div>
      )}
    </div>
  );
}
