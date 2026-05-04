import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { splitAPI } from '../services/api';
import { useDataset } from '../context/DatasetContext';

const RATIOS = ['70-30', '80-20', '90-10'];
const COLORS = ['#7c3aed', '#581c87', '#4c1d95', '#a78bfa'];

export default function TrainTestSplit() {
  const { selectedDataset } = useDataset();
  const [ratio, setRatio] = useState('80-20');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSplit = async () => {
    if (!selectedDataset) { toast.error('Select a dataset first'); return; }
    setLoading(true);
    try {
      const { data } = await splitAPI.trainTest({ datasetId: selectedDataset._id, ratio });
      setResult(data);
      toast.success('Split completed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Split failed');
    } finally {
      setLoading(false);
    }
  };

  const pieData = result ? [
    { name: 'Train', value: result.trainSize },
    { name: 'Test', value: result.testSize }
  ] : [];

  if (!selectedDataset) return (
    <div className="text-center py-20" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <p className="text-violet-400 text-4xl mb-4">⊘</p>
      <p className="text-violet-300 text-sm">Select a dataset first</p>
    </div>
  );

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <h1 className="text-xl font-bold text-violet-100 mb-1">Train / Test Split</h1>
      <p className="text-violet-500 text-xs mb-6">{selectedDataset.originalName}</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {RATIOS.map(r => (
          <button key={r} onClick={() => setRatio(r)}
            className={`p-4 rounded-xl border text-sm font-medium transition-all ${
              ratio === r
                ? 'border-violet-500 bg-violet-900/30 text-violet-200'
                : 'border-violet-900/20 bg-gray-900/30 text-violet-500 hover:border-violet-700/40'
            }`}>
            <div className="text-2xl font-bold mb-1">{r}</div>
            <div className="text-xs opacity-70">Train — Test</div>
          </button>
        ))}
      </div>

      <button onClick={runSplit} disabled={loading}
        className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl text-sm font-medium disabled:opacity-50 transition-all mb-6">
        {loading ? 'Splitting...' : 'Apply Split'}
      </button>

      {result && (
        <div className="space-y-4">
          {/* Pie chart */}
          <div className="bg-gray-900/40 border border-violet-900/20 rounded-xl p-6">
            <h2 className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-4 text-center">Split Distribution</h2>
            <div className="flex items-center justify-center gap-8">
              <PieChart width={220} height={220}>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid #4c1d95', color: '#c4b5fd', fontSize: 11 }} />
              </PieChart>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-violet-600 inline-block" /><span className="text-violet-300 text-sm">Training Set</span></div>
                  <p className="text-violet-100 text-3xl font-bold">{result.trainSize.toLocaleString()}</p>
                  <p className="text-violet-500 text-xs">{result.trainPct}% of data</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-purple-900 inline-block" /><span className="text-violet-300 text-sm">Test Set</span></div>
                  <p className="text-violet-100 text-3xl font-bold">{result.testSize.toLocaleString()}</p>
                  <p className="text-violet-500 text-xs">{result.testPct}% of data</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview tables */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { 
                label: 'Training Preview', 
                data: result.trainPreview, 
                borderClass: 'border-violet-900/20',
                titleClass: 'text-violet-300',
                headClass: 'text-violet-400',
                cellClass: 'text-white' 
              },
              { 
                label: 'Test Preview', 
                data: result.testPreview, 
                borderClass: 'border-purple-900/20',
                titleClass: 'text-purple-300',
                headClass: 'text-purple-400',
                cellClass: 'text-white' 
              }
            ].map(({ label, data, borderClass, titleClass, headClass, cellClass }) => (
              <div key={label} className={`bg-gray-900/40 border ${borderClass} rounded-xl p-4`}>
                <h3 className={`${titleClass} text-xs font-semibold uppercase tracking-wider mb-3`}>{label}</h3>
                <div className="overflow-x-auto">
                  <table className="text-xs w-full">
                    <thead>
                      <tr>
                        {(Array.isArray(selectedDataset.columns) ? selectedDataset.columns : []).slice(0, 4).map(col => (
                          <th key={col} className={`px-2 py-1 text-left ${headClass} font-medium whitespace-nowrap`}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                       {data?.slice(0, 5).map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-gray-900/20' : ''}>
                          {(Array.isArray(selectedDataset.columns) ? selectedDataset.columns : []).slice(0, 4).map(col => (
                            <td key={col} className={`px-2 py-1 ${cellClass} whitespace-nowrap`}>{String(row[col] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
