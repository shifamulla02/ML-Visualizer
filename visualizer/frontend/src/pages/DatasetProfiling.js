import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import toast from 'react-hot-toast';
import { datasetAPI } from '../services/api';
import { useDataset } from '../context/DatasetContext';

const COLORS = ['#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#8b5cf6', '#a78bfa', '#c4b5fd'];

export default function DatasetProfiling() {
  const { selectedDataset } = useDataset();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const loadProfile = async () => {
    if (!selectedDataset) { toast.error('Select a dataset first'); return; }
    setLoading(true);
    try {
      const { data } = await datasetAPI.profile(selectedDataset._id);
      setProfile(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Profile failed');
    } finally {
      setLoading(false);
    }
  };

  const tabs = ['overview', 'distributions', 'missing', 'correlations'];

  if (!selectedDataset) return (
    <div className="text-center py-20" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <p className="text-violet-400 text-4xl mb-4">◈</p>
      <p className="text-violet-300 text-sm">Select a dataset from Upload page first</p>
    </div>
  );

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-violet-100">Dataset Profiling</h1>
          <p className="text-violet-500 text-xs mt-1">{selectedDataset.originalName}</p>
        </div>
        <button onClick={loadProfile} disabled={loading}
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-50 transition-all">
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Rows', value: selectedDataset.rows?.toLocaleString() },
          { label: 'Columns', value: selectedDataset.columns?.length },
          { label: 'Type', value: selectedDataset.datasetType },
          { label: 'Missing', value: Object.values(selectedDataset.missingValues || {}).reduce((a, b) => a + b, 0) },
        ].map(s => (
          <div key={s.label} className="bg-gray-900/50 border border-violet-900/20 rounded-xl p-4">
            <p className="text-violet-500 text-xs uppercase tracking-wider">{s.label}</p>
            <p className="text-violet-200 text-xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {profile && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-900/30 p-1 rounded-lg w-fit">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-xs font-medium transition-all capitalize ${
                  activeTab === tab ? 'bg-violet-600 text-white' : 'text-violet-400 hover:text-violet-200'
                }`}>{tab}</button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-4">
              {/* Class distribution */}
              {Object.keys(profile.profile?.classDistribution || {}).length > 0 && (
                <div className="bg-gray-900/40 border border-violet-900/20 rounded-xl p-4">
                  <h3 className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-4">Class Distribution</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={Object.entries(profile.profile.classDistribution).map(([k, v]) => ({ name: k, value: v }))}
                        cx="50%" cy="50%" outerRadius={70} dataKey="value">
                        {Object.keys(profile.profile.classDistribution).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid #4c1d95', color: '#c4b5fd', fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(profile.profile.classDistribution).map(([k, v], i) => (
                      <span key={k} className="flex items-center gap-1 text-xs text-violet-400">
                        <span style={{ background: COLORS[i % COLORS.length] }} className="w-2 h-2 rounded-full inline-block" />
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Column types */}
              <div className="bg-gray-900/40 border border-violet-900/20 rounded-xl p-4">
                <h3 className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-4">Column Summary</h3>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {(Array.isArray(selectedDataset.columns) ? selectedDataset.columns : []).map(col => {
                    const dtype = selectedDataset.datatypeSummary?.[col];
                    const missing = selectedDataset.missingValues?.[col] || 0;
                    return (
                      <div key={col} className="flex items-center justify-between text-xs">
                        <span className="text-violet-300 truncate max-w-28">{col}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${dtype === 'numeric' ? 'bg-blue-900/30 text-blue-300' : 'bg-amber-900/30 text-amber-300'}`}>{dtype}</span>
                          {missing > 0 && <span className="text-red-400 text-xs">{missing} null</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'distributions' && (
            <div className="space-y-4">
              {Object.entries(profile.profile?.numericStats || {}).slice(0, 4).map(([col, stats]) => (
                <div key={col} className="bg-gray-900/40 border border-violet-900/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-violet-300 text-xs font-semibold uppercase">{col}</h3>
                    <div className="flex gap-3 text-xs text-violet-500">
                      <span>mean: {stats.mean}</span>
                      <span>std: {stats.std}</span>
                      <span>min: {stats.min}</span>
                      <span>max: {stats.max}</span>
                    </div>
                  </div>
                  {stats.histogram && (
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={stats.histogram}>
                        <XAxis dataKey="range" tick={{ fill: '#7c3aed', fontSize: 8 }} />
                        <YAxis tick={{ fill: '#7c3aed', fontSize: 8 }} />
                        <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid #4c1d95', color: '#c4b5fd', fontSize: 10 }} />
                        <Bar dataKey="count" fill="#7c3aed" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              ))}
              {Object.entries(profile.profile?.categoricalStats || {}).slice(0, 2).map(([col, data]) => (
                <div key={col} className="bg-gray-900/40 border border-violet-900/20 rounded-xl p-4">
                  <h3 className="text-violet-300 text-xs font-semibold uppercase mb-3">{col} (categorical)</h3>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={data} layout="vertical">
                      <XAxis type="number" tick={{ fill: '#7c3aed', fontSize: 8 }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: '#7c3aed', fontSize: 8 }} width={80} />
                      <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid #4c1d95', color: '#c4b5fd', fontSize: 10 }} />
                      <Bar dataKey="value" fill="#6d28d9" radius={[0, 2, 2, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'missing' && (
            <div className="bg-gray-900/40 border border-violet-900/20 rounded-xl p-4">
              <h3 className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-4">Missing Values per Column</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={(Array.isArray(selectedDataset.columns) ? selectedDataset.columns : []).map(col => ({
                  col: col.length > 10 ? col.slice(0, 10) + '...' : col,
                  missing: selectedDataset.missingValues?.[col] || 0
                }))}>
                  <XAxis dataKey="col" tick={{ fill: '#7c3aed', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#7c3aed', fontSize: 9 }} />
                  <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid #4c1d95', color: '#c4b5fd', fontSize: 10 }} />
                  <Bar dataKey="missing" fill="#ef4444" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeTab === 'correlations' && (
            <div className="bg-gray-900/40 border border-violet-900/20 rounded-xl p-4">
              <h3 className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-4">Top Feature Correlations</h3>
              {profile.profile?.correlations?.length > 0 ? (
                <div className="space-y-2">
                  {profile.profile.correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).slice(0, 10).map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-violet-400 text-xs w-40 truncate">{c.col1} × {c.col2}</span>
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{
                          width: `${Math.abs(c.correlation) * 100}%`,
                          background: c.correlation > 0 ? '#7c3aed' : '#dc2626'
                        }} />
                      </div>
                      <span className={`text-xs font-mono w-14 text-right ${c.correlation > 0 ? 'text-violet-300' : 'text-red-400'}`}>
                        {c.correlation > 0 ? '+' : ''}{c.correlation}
                      </span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-violet-500 text-xs">No numeric correlations found</p>}
            </div>
          )}
        </>
      )}

      {!profile && !loading && (
        <div className="text-center py-16 bg-gray-900/20 border border-violet-900/10 rounded-2xl">
          <p className="text-violet-600 text-4xl mb-3">◈</p>
          <p className="text-violet-400 text-sm">Click "Run Analysis" to profile your dataset</p>
        </div>
      )}
    </div>
  );
}
