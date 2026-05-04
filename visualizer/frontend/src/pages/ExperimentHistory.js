import React, { useState, useEffect } from 'react';
import { experimentAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function ExperimentHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    experimentAPI.history().then(r => { setSessions(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const deleteSession = async (id) => {
    try {
      await experimentAPI.delete(id);
      setSessions(prev => prev.filter(s => s._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  if (loading) return (
    <div className="flex justify-center py-20" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <h1 className="text-xl font-bold text-violet-100 mb-1">Experiment History</h1>
      <p className="text-violet-500 text-xs mb-6">{sessions.length} training sessions</p>

      {sessions.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/20 border border-violet-900/10 rounded-2xl">
          <p className="text-violet-600 text-4xl mb-3">⊟</p>
          <p className="text-violet-400 text-sm">No experiments yet. Train a model to begin.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => (
            <div key={s._id} className="bg-gray-900/40 border border-violet-900/20 rounded-xl overflow-hidden">
              <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-violet-900/10 transition-all"
                onClick={() => setExpanded(expanded === s._id ? null : s._id)}>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-violet-900/40 border border-violet-700/30 flex items-center justify-center text-violet-400 text-sm">
                    {s.taskType === 'classification' ? '⬡' : '⧊'}
                  </div>
                  <div>
                    <p className="text-violet-200 text-sm font-medium capitalize">{s.modelType?.replace(/_/g, ' ')}</p>
                    <div className="flex gap-3 mt-0.5">
                      <span className="text-violet-500 text-xs">{s.datasetName}</span>
                      <span className="text-violet-600 text-xs">·</span>
                      <span className="text-violet-500 text-xs">target: {s.targetColumn}</span>
                      <span className="text-violet-600 text-xs">·</span>
                      <span className="text-violet-500 text-xs">{new Date(s.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {s.taskType === 'classification' && s.metrics?.accuracy && (
                    <span className="text-violet-300 text-sm font-bold">{(s.metrics.accuracy * 100).toFixed(1)}%</span>
                  )}
                  {s.taskType === 'regression' && s.metrics?.r2_score !== undefined && (
                    <span className="text-blue-300 text-sm font-bold">R²: {s.metrics.r2_score}</span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs ${s.taskType === 'classification' ? 'bg-violet-900/30 text-violet-300' : 'bg-blue-900/30 text-blue-300'}`}>
                    {s.taskType}
                  </span>
                  <button onClick={e => { e.stopPropagation(); deleteSession(s._id); }}
                    className="text-red-500 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-900/30 hover:border-red-700/50 transition-all">
                    Delete
                  </button>
                  <span className="text-violet-600 text-xs">{expanded === s._id ? '▲' : '▼'}</span>
                </div>
              </div>

              {expanded === s._id && (
                <div className="border-t border-violet-900/20 p-4 bg-violet-900/5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-violet-400 text-xs uppercase tracking-wider mb-2">Metrics</h3>
                      <div className="space-y-1.5">
                        {Object.entries(s.metrics || {}).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-violet-500 text-xs capitalize">{k.replace(/_/g, ' ')}</span>
                            <span className="text-violet-300 text-xs font-mono">
                              {v < 1 && k !== 'mse' && k !== 'mae' ? `${(v * 100).toFixed(2)}%` : v}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-violet-400 text-xs uppercase tracking-wider mb-2">Preprocessing Steps</h3>
                      {s.preprocessingSteps?.length > 0 ? (
                        <div className="space-y-1">
                          {s.preprocessingSteps.map((step, i) => (
                            <div key={i} className="text-xs text-violet-400 flex gap-2">
                              <span className="text-violet-600">{i + 1}.</span>
                              <span className="capitalize">{step.type}</span>
                              <span className="text-violet-500">on {step.column}</span>
                              <span className="text-violet-600">({step.strategy || step.method})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-violet-600 text-xs">No preprocessing applied</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
