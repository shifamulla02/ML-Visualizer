import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { preprocessAPI } from '../services/api';
import { useDataset } from '../context/DatasetContext';

const stepColors = { missing: 'violet', encoding: 'purple', scaling: 'indigo' };

export default function PreprocessingPipeline() {
  const { selectedDataset, setPreprocessSteps } = useDataset();
  const [initialized, setInitialized] = useState(false);
  const [steps, setSteps] = useState([]);
  const [preview, setPreview] = useState({ before: [], after: [] });
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ type: 'missing', column: '', strategy: 'mean', method: 'label', scaleMethod: 'standard' });

  useEffect(() => {
    if (selectedDataset) {
      preprocessAPI.history(selectedDataset._id).then(r => {
        setSteps(r.data.steps || []);
        if (r.data.steps?.length > 0) setInitialized(true);
      }).catch(() => {});
    }
  }, [selectedDataset]);

  const init = async () => {
    if (!selectedDataset) { toast.error('Select a dataset first'); return; }
    setLoading(true);
    try {
      const { data } = await preprocessAPI.init({ datasetId: selectedDataset._id });
      setInitialized(true);
      setSteps([]);
      toast.success('Pipeline initialized');
    } catch (err) { toast.error(err.response?.data?.message || 'Init failed'); }
    finally { setLoading(false); }
  };

  const applyStep = async () => {
    if (!form.column) { toast.error('Select a column'); return; }
    setLoading(true);
    try {
      let data;
      if (form.type === 'missing') {
        const r = await preprocessAPI.missing({ datasetId: selectedDataset._id, column: form.column, strategy: form.strategy });
        data = r.data;
      } else if (form.type === 'encoding') {
        const r = await preprocessAPI.encoding({ datasetId: selectedDataset._id, column: form.column, method: form.method });
        data = r.data;
      } else if (form.type === 'scaling') {
        const r = await preprocessAPI.scaling({ datasetId: selectedDataset._id, column: form.column, method: form.scaleMethod });
        data = r.data;
      }
      setSteps(data.steps || []);
      setPreprocessSteps(data.steps || []);
      setPreview({ before: data.before || [], after: data.after || [] });
      toast.success(data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Step failed'); }
    finally { setLoading(false); }
  };

  const undo = async () => {
    try {
      const { data } = await preprocessAPI.undo({ datasetId: selectedDataset._id });
      setSteps(data.steps || []);
      setPreprocessSteps(data.steps || []);
      toast.success('Step undone');
    } catch (err) { toast.error('Undo failed'); }
  };

  if (!selectedDataset) return (
    <div className="text-center py-20" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <p className="text-violet-400 text-4xl mb-4">⧩</p>
      <p className="text-violet-300 text-sm">Select a dataset first</p>
    </div>
  );

  const columns = Array.isArray(selectedDataset.columns) ? selectedDataset.columns : [];

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-violet-100">Preprocessing Pipeline</h1>
          <p className="text-violet-500 text-xs mt-1">{selectedDataset.originalName}</p>
        </div>
        {!initialized ? (
          <button onClick={init} disabled={loading}
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-50">
            Initialize Pipeline
          </button>
        ) : (
          <button onClick={undo} disabled={steps.length === 0}
            className="bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-800/30 px-4 py-2 rounded-lg text-xs disabled:opacity-30">
            ↩ Undo Last Step
          </button>
        )}
      </div>

      {/* Pipeline timeline */}
      {steps.length > 0 && (
        <div className="mb-6 bg-gray-900/30 border border-violet-900/20 rounded-xl p-4">
          <h2 className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-4">Pipeline Steps</h2>
          <div className="flex items-start gap-2 overflow-x-auto pb-2">
            {steps.map((step, i) => (
              <React.Fragment key={i}>
                <div className={`flex-shrink-0 bg-${stepColors[step.type] || 'violet'}-900/30 border border-${stepColors[step.type] || 'violet'}-700/30 rounded-lg p-3 min-w-32`}>
                  <p className="text-violet-500 text-xs">Step {i + 1}</p>
                  <p className="text-violet-200 text-xs font-medium capitalize mt-0.5">{step.type}</p>
                  <p className="text-violet-400 text-xs truncate">{step.column}</p>
                  <p className="text-violet-500 text-xs">{step.strategy || step.method}</p>
                </div>
                {i < steps.length - 1 && <div className="flex-shrink-0 text-violet-600 mt-4">→</div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {initialized && (
        <div className="grid grid-cols-2 gap-4">
          {/* Controls */}
          <div className="bg-gray-900/40 border border-violet-900/20 rounded-xl p-4">
            <h2 className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-4">Apply Transformation</h2>
            <div className="space-y-3">
              <div>
                <label className="text-violet-500 text-xs uppercase tracking-wider block mb-1">Step Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                  className="w-full bg-slate-900 border border-violet-800/30 rounded-lg px-3 py-2 text-violet-200 text-xs focus:outline-none focus:border-violet-500">
                  <option value="missing">Handle Missing Values</option>
                  <option value="encoding">Feature Encoding</option>
                  <option value="scaling">Feature Scaling</option>
                </select>
              </div>
              <div>
                <label className="text-violet-500 text-xs uppercase tracking-wider block mb-1">Column</label>
                <select value={form.column} onChange={e => setForm({...form, column: e.target.value})}
                  className="w-full bg-slate-900 border border-violet-800/30 rounded-lg px-3 py-2 text-violet-200 text-xs focus:outline-none focus:border-violet-500">
                  <option value="">Select column...</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {form.type === 'missing' && (
                <div>
                  <label className="text-violet-500 text-xs uppercase tracking-wider block mb-1">Strategy</label>
                  <select value={form.strategy} onChange={e => setForm({...form, strategy: e.target.value})}
                    className="w-full bg-slate-900 border border-violet-800/30 rounded-lg px-3 py-2 text-violet-200 text-xs focus:outline-none focus:border-violet-500">
                    <option value="mean">Fill Mean</option>
                    <option value="median">Fill Median</option>
                    <option value="mode">Fill Mode</option>
                    <option value="drop">Drop Rows</option>
                  </select>
                </div>
              )}
              {form.type === 'encoding' && (
                <div>
                  <label className="text-violet-500 text-xs uppercase tracking-wider block mb-1">Method</label>
                  <select value={form.method} onChange={e => setForm({...form, method: e.target.value})}
                    className="w-full bg-slate-900 border border-violet-800/30 rounded-lg px-3 py-2 text-violet-200 text-xs focus:outline-none focus:border-violet-500">
                    <option value="label">Label Encoding</option>
                    <option value="onehot">One-Hot Encoding</option>
                  </select>
                </div>
              )}
              {form.type === 'scaling' && (
                <div>
                  <label className="text-violet-500 text-xs uppercase tracking-wider block mb-1">Scaler</label>
                  <select value={form.scaleMethod} onChange={e => setForm({...form, scaleMethod: e.target.value})}
                    className="w-full bg-slate-900 border border-violet-800/30 rounded-lg px-3 py-2 text-violet-200 text-xs focus:outline-none focus:border-violet-500">
                    <option value="standard">StandardScaler (z-score)</option>
                    <option value="minmax">MinMaxScaler (0-1)</option>
                  </select>
                </div>
              )}
              <button onClick={applyStep} disabled={loading || !form.column}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2 rounded-lg text-xs font-medium disabled:opacity-40 transition-all mt-2">
                {loading ? 'Applying...' : 'Apply Step'}
              </button>
            </div>
          </div>

          {/* Before/After preview */}
          <div className="bg-gray-900/40 border border-violet-900/20 rounded-xl p-4">
            <h2 className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-4">Before / After Preview</h2>
            {preview.before.length > 0 ? (
              <div className="space-y-3">
                <div>
                  <p className="text-red-400 text-xs mb-1">Before</p>
                  <div className="overflow-x-auto rounded border border-red-900/20">
                    <table className="text-xs w-full">
                      <tbody>
                        {preview.before.slice(0, 3).map((row, i) => (
                          <tr key={i} className="border-b border-red-900/10">
                            {Object.entries(row).slice(0, 4).map(([k, v]) => (
                              <td key={k} className="px-2 py-1 text-red-300">{String(v)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <p className="text-green-400 text-xs mb-1">After</p>
                  <div className="overflow-x-auto rounded border border-green-900/20">
                    <table className="text-xs w-full">
                      <tbody>
                        {preview.after.slice(0, 3).map((row, i) => (
                          <tr key={i} className="border-b border-green-900/10">
                            {Object.entries(row).slice(0, 4).map(([k, v]) => (
                              <td key={k} className="px-2 py-1 text-green-300">{String(v)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-violet-600 text-xs text-center py-8">Apply a step to see before/after comparison</p>
            )}
          </div>
        </div>
      )}

      {!initialized && (
        <div className="text-center py-16 bg-gray-900/20 border border-violet-900/10 rounded-2xl">
          <p className="text-violet-600 text-4xl mb-3">⧩</p>
          <p className="text-violet-400 text-sm">Click "Initialize Pipeline" to begin preprocessing</p>
        </div>
      )}
    </div>
  );
}
