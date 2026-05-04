import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { datasetAPI, experimentAPI } from '../services/api';
import AlgoVisualizer from '../components/AlgoVisualizer';

const StatCard = ({ label, value, sub, color }) => (
  <div className={`bg-gray-900/50 border border-${color}-900/30 rounded-xl p-5`}>
    <p className={`text-${color}-400 text-xs tracking-wider uppercase mb-1`}>{label}</p>
    <p className={`text-${color}-100 text-3xl font-bold`}>{value}</p>
    {sub && <p className={`text-${color}-500 text-xs mt-1`}>{sub}</p>}
  </div>
);

const steps = [
  { num: '01', label: 'Upload Dataset', desc: 'Import your CSV data', path: '/upload', color: 'violet' },
  { num: '02', label: 'Profile & Explore', desc: 'Analyze distributions', path: '/profiling', color: 'purple' },
  { num: '03', label: 'Preprocess', desc: 'Clean & transform data', path: '/preprocessing', color: 'indigo' },
  { num: '04', label: 'Split Data', desc: 'Train/test partition', path: '/split', color: 'blue' },
  { num: '05', label: 'Train Model', desc: 'Fit ML algorithms', path: '/train', color: 'violet' },
  { num: '06', label: 'Evaluate', desc: 'Metrics & visualizations', path: '/metrics', color: 'purple' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ datasets: 0, experiments: 0, models: 0 });

  useEffect(() => {
    Promise.all([datasetAPI.list(), experimentAPI.history()]).then(([ds, ex]) => {
      const models = [...new Set(ex.data.map(e => e.modelType))].length;
      const dsList = ds.data?.data?.datasets || ds.data || [];
      setStats({ datasets: Array.isArray(dsList) ? dsList.length : 0, experiments: ex.data.length, models });
    }).catch(() => { });
  }, []);

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-violet-100">
          Welcome back, <span className="text-violet-400">{user?.name}</span>
        </h1>
        <p className="text-violet-500 text-sm mt-1">Your ML experiment workspace</p>
      </div>

      <div className="mb-10 w-full overflow-hidden rounded-2xl shadow-2xl">
        <AlgoVisualizer />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Datasets" value={stats.datasets} sub="uploaded" color="violet" />
        <StatCard label="Experiments" value={stats.experiments} sub="trained" color="violet" />
        <StatCard label="Model Types" value={stats.models} sub="used" color="violet" />
      </div>

      <div className="mb-8">
        <h2 className="text-violet-300 text-sm font-semibold mb-4 tracking-wider uppercase">ML Pipeline Workflow</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {steps.map((step, i) => (
            <Link key={i} to={step.path}
              className="group bg-gray-900/40 border border-violet-900/20 hover:border-violet-600/40 rounded-xl p-4 transition-all hover:bg-violet-900/10">
              <div className="flex items-start gap-3">
                <span className="text-violet-700 text-xs font-mono font-bold">{step.num}</span>
                <div>
                  <p className="text-violet-200 text-sm font-medium group-hover:text-violet-100">{step.label}</p>
                  <p className="text-violet-500 text-xs mt-0.5">{step.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-gray-900/30 border border-violet-900/20 rounded-xl p-6">
        <h2 className="text-violet-300 text-sm font-semibold mb-4 tracking-wider uppercase">Quick Start</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/upload" className="flex items-center gap-3 p-3 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-700/30 rounded-lg transition-all">
            <span className="text-violet-400 text-lg">⬆</span>
            <span className="text-violet-300 text-sm">Upload New Dataset</span>
          </Link>
          <Link to="/history" className="flex items-center gap-3 p-3 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-700/30 rounded-lg transition-all">
            <span className="text-purple-400 text-lg">⊟</span>
            <span className="text-purple-300 text-sm">View Experiments</span>
          </Link>
          <Link to="/compare" className="flex items-center gap-3 p-3 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-700/30 rounded-lg transition-all">
            <span className="text-indigo-400 text-lg">⊞</span>
            <span className="text-indigo-300 text-sm">Compare Models</span>
          </Link>
          <Link to="/report" className="flex items-center gap-3 p-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-700/30 rounded-lg transition-all">
            <span className="text-blue-400 text-lg">⬒</span>
            <span className="text-blue-300 text-sm">Download Report</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
