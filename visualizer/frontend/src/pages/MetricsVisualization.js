import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Cell } from 'recharts';
import { experimentAPI } from '../services/api';
import { useDataset } from '../context/DatasetContext';
import toast from 'react-hot-toast';

const COLORS = ['#7c3aed', '#6d28d9', '#5b21b6', '#8b5cf6'];

export default function MetricsVisualization() {
  const { lastTrainingResult } = useDataset();
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    experimentAPI.history().then(r => {
      setSessions(r.data);
      if (r.data.length > 0) setSelected(r.data[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (lastTrainingResult?.session) {
      experimentAPI.history().then(r => {
        setSessions(r.data);
        const fresh = r.data.find(s => s._id === lastTrainingResult.session._id);
        if (fresh) setSelected(fresh);
      }).catch(() => {});
    }
  }, [lastTrainingResult]);

  const session = selected;
  const metrics = session?.metrics || {};
  const isClassification = session?.taskType === 'classification';

  const classMetricsData = isClassification ? [
    { name: 'Accuracy', value: metrics.accuracy * 100 || 0 },
    { name: 'Precision', value: metrics.precision * 100 || 0 },
    { name: 'Recall', value: metrics.recall * 100 || 0 },
    { name: 'F1-Score', value: metrics.f1_score * 100 || 0 },
  ] : [];

  const confMatrix = session?.confusionMatrix || [];
  const labels = session?.confusionMatrixLabels || [];
  const featureImportance = session?.featureImportance || [];

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-violet-100">Metrics Visualization</h1>
          <p className="text-violet-500 text-xs mt-1">Evaluation results</p>
        </div>
        {sessions.length > 0 && (
          <select value={selected?._id || ''} onChange={e => setSelected(sessions.find(s => s._id === e.target.value))}
            className="bg-slate-900 border border-violet-800/30 rounded-lg px-3 py-2 text-violet-200 text-xs focus:outline-none focus:border-violet-500">
            {sessions.map(s => (
              <option key={s._id} value={s._id}>{s.modelType} — {s.datasetName} ({new Date(s.createdAt).toLocaleDateString()})</option>
            ))}
          </select>
        )}
      </div>

      {!session ? (
        <div className="text-center py-20 bg-gray-900/20 border border-violet-900/10 rounded-2xl">
          <p className="text-violet-600 text-4xl mb-3">◉</p>
          <p className="text-violet-400 text-sm">Train a model first to see metrics</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Model info */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Model', value: session.modelType?.replace(/_/g, ' ') },
              { label: 'Target', value: session.targetColumn },
              { label: 'Task', value: session.taskType },
              { label: 'Split', value: session.splitRatio },
            ].map(s => (
              <div key={s.label} className="bg-gray-900/40 border border-violet-900/20 rounded-xl p-3">
                <p className="text-violet-500 text-xs uppercase tracking-wider">{s.label}</p>
                <p className="text-violet-200 text-sm font-medium mt-1 capitalize">{s.value}</p>
              </div>
            ))}
          </div>

          {isClassification ? (
            <>
              {/* Metrics bar chart */}
              <div className="bg-gray-900/40 border border-violet-900/20 rounded-xl p-4">
                <h2 className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-4">Classification Metrics</h2>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {classMetricsData.map((m, i) => (
                    <div key={m.name} className="text-center bg-violet-900/20 rounded-lg p-3">
                      <p className="text-violet-500 text-xs">{m.name}</p>
                      <p className="text-violet-100 text-2xl font-bold mt-1">{m.value.toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={classMetricsData}>
                    <XAxis dataKey="name" tick={{ fill: '#7c3aed', fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#7c3aed', fontSize: 9 }} tickFormatter={v => `${v}%`} />
                    <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid #4c1d95', color: '#c4b5fd', fontSize: 10 }}
                      formatter={v => [`${v.toFixed(2)}%`]} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {classMetricsData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Confusion matrix */}
              {confMatrix.length > 0 && (
                <div className="bg-gray-900/40 border border-violet-900/20 rounded-xl p-4">
                  <h2 className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-4">Confusion Matrix</h2>
                  <div className="overflow-x-auto">
                    <table className="text-xs mx-auto">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-violet-500">Pred ↓ / True →</th>
                          {labels.map(l => <th key={l} className="px-3 py-2 text-violet-300 font-medium">{l}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {confMatrix.map((row, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-violet-300 font-medium">{labels[i]}</td>
                            {row.map((val, j) => {
                              const maxVal = Math.max(...confMatrix.flat());
                              const intensity = maxVal > 0 ? val / maxVal : 0;
                              return (
                                <td key={j} className="px-3 py-2 text-center font-mono rounded" style={{
                                  background: i === j ? `rgba(124,58,237,${0.2 + intensity * 0.7})` : `rgba(220,38,38,${intensity * 0.5})`,
                                  color: i === j ? '#c4b5fd' : '#fca5a5'
                                }}>{val}</td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Regression metrics */
            <div className="bg-gray-900/40 border border-violet-900/20 rounded-xl p-4">
              <h2 className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-4">Regression Metrics</h2>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(metrics).map(([k, v]) => (
                  <div key={k} className="text-center bg-violet-900/20 rounded-lg p-3">
                    <p className="text-violet-500 text-xs uppercase">{k.replace(/_/g, ' ')}</p>
                    <p className="text-violet-100 text-2xl font-bold mt-1">{Number(v).toFixed(4)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feature importance */}
          {featureImportance.length > 0 && (
            <div className="bg-gray-900/40 border border-violet-900/20 rounded-xl p-4">
              <h2 className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-4">Feature Importance</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={featureImportance.slice(0, 10)} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#7c3aed', fontSize: 9 }} />
                  <YAxis dataKey="feature" type="category" tick={{ fill: '#7c3aed', fontSize: 9 }} width={100} />
                  <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid #4c1d95', color: '#c4b5fd', fontSize: 10 }} />
                  <Bar dataKey="importance" fill="#7c3aed" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
