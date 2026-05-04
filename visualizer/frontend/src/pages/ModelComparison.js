import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { experimentAPI, modelAPI } from '../services/api';
import toast from 'react-hot-toast';

const METRIC_COLORS = { accuracy: '#7c3aed', precision: '#6d28d9', recall: '#8b5cf6', f1_score: '#a78bfa' };

export default function ModelComparison() {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [compareData, setCompareData] = useState(null);

  useEffect(() => {
    experimentAPI.history().then(r => setSessions(r.data)).catch(() => {});
  }, []);

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 4 ? [...prev, id] : prev);
  };

  const compare = async () => {
    if (selected.length < 2) { toast.error('Select at least 2 experiments'); return; }
    setLoading(true);
    try {
      const { data } = await modelAPI.compare({ sessionIds: selected });
      setCompareData(data);
    } catch (err) { toast.error('Comparison failed'); }
    finally { setLoading(false); }
  };

  const chartData = compareData ? (() => {
    const metrics = ['accuracy', 'precision', 'recall', 'f1_score'];
    return metrics.map(m => ({
      name: m.replace('_', ' ').toUpperCase(),
      ...compareData.reduce((acc, s) => ({
        ...acc,
        [s.modelType + '_' + s._id.slice(-4)]: s.metrics?.[m] ? +(s.metrics[m] * 100).toFixed(1) : null
      }), {})
    }));
  })() : [];

  const sessionKeys = compareData?.map(s => s.modelType + '_' + s._id.slice(-4)) || [];

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <h1 className="text-xl font-bold text-violet-100 mb-1">Model Comparison</h1>
      <p className="text-violet-500 text-xs mb-6">Compare experiment results side-by-side</p>

      {sessions.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/20 border border-violet-900/10 rounded-2xl">
          <p className="text-violet-600 text-4xl mb-3">⊞</p>
          <p className="text-violet-400 text-sm">Train some models first to compare them</p>
        </div>
      ) : (
        <>
          <div className="bg-gray-900/40 border border-violet-900/20 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-violet-300 text-xs font-semibold uppercase tracking-wider">Select Experiments (2-4)</h2>
              <button onClick={compare} disabled={selected.length < 2 || loading}
                className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-40">
                {loading ? 'Comparing...' : 'Compare Selected'}
              </button>
            </div>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {sessions.map(s => (
                <div key={s._id} onClick={() => toggleSelect(s._id)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    selected.includes(s._id) ? 'border-violet-500 bg-violet-900/20' : 'border-violet-900/20 hover:border-violet-700/40'
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selected.includes(s._id) ? 'border-violet-500 bg-violet-600' : 'border-violet-700'}`}>
                      {selected.includes(s._id) && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div>
                      <p className="text-violet-200 text-xs font-medium capitalize">{s.modelType?.replace(/_/g, ' ')}</p>
                      <p className="text-violet-500 text-xs">{s.datasetName} · {new Date(s.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {s.taskType === 'classification' && s.metrics?.accuracy && (
                      <span className="text-xs text-violet-300 bg-violet-900/30 px-2 py-0.5 rounded">
                        Acc: {(s.metrics.accuracy * 100).toFixed(1)}%
                      </span>
                    )}
                    {s.taskType === 'regression' && s.metrics?.r2_score !== undefined && (
                      <span className="text-xs text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded">
                        R²: {s.metrics.r2_score}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {compareData && (
            <div className="space-y-4">
              <div className="bg-gray-900/40 border border-violet-900/20 rounded-xl p-4">
                <h2 className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-4">Metrics Comparison</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fill: '#7c3aed', fontSize: 9 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#7c3aed', fontSize: 9 }} tickFormatter={v => `${v}%`} />
                    <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid #4c1d95', color: '#c4b5fd', fontSize: 10 }}
                      formatter={v => v ? [`${v}%`] : ['N/A']} />
                    <Legend wrapperStyle={{ fontSize: 10, color: '#a78bfa' }} />
                    {sessionKeys.map((key, i) => (
                      <Bar key={key} dataKey={key} fill={Object.values(METRIC_COLORS)[i % 4]} radius={[3, 3, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto bg-gray-900/40 border border-violet-900/20 rounded-xl p-4">
                <h2 className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-4">Detailed Comparison</h2>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-violet-900/20">
                      <th className="text-left text-violet-400 py-2 pr-4">Metric</th>
                      {compareData.map(s => (
                        <th key={s._id} className="text-left text-violet-300 py-2 pr-4 capitalize">
                          {s.modelType?.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(compareData[0]?.metrics || {}).map(metric => (
                      <tr key={metric} className="border-b border-violet-900/10">
                        <td className="text-violet-400 py-2 pr-4 capitalize">{metric.replace(/_/g, ' ')}</td>
                        {compareData.map(s => {
                          const vals = compareData.map(ss => ss.metrics?.[metric] || 0);
                          const best = Math.max(...vals);
                          const val = s.metrics?.[metric];
                          return (
                            <td key={s._id} className={`py-2 pr-4 font-mono ${val === best ? 'text-green-400 font-bold' : 'text-violet-300'}`}>
                              {val !== undefined ? (val < 1 && metric !== 'mse' && metric !== 'mae' ? `${(val * 100).toFixed(1)}%` : val) : 'N/A'}
                            </td>
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
      )}
    </div>
  );
}
