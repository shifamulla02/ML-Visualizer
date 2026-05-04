import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { datasetAPI } from '../services/api';
import { useDataset } from '../context/DatasetContext';

export default function UploadDataset() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [selected, setSelected] = useState(null);
  const fileRef = useRef();
  const { selectedDataset, setSelectedDataset } = useDataset();

  useEffect(() => {
    datasetAPI.list().then(r => {
      const dsList = r.data?.data?.datasets || r.data || [];
      setDatasets(Array.isArray(dsList) ? dsList : []);
    }).catch(() => {});
  }, []);

  const handleFile = async (file) => {
    if (!file.name.endsWith('.csv')) { toast.error('Only CSV files allowed'); return; }
    if (file.size > 50 * 1024 * 1024) { toast.error('File too large (max 50MB)'); return; }
    const formData = new FormData();
    formData.append('dataset', file);
    setUploading(true);
    try {
      const { data } = await datasetAPI.upload(formData);
      toast.success('Dataset uploaded!');
      const newDataset = data?.data?.dataset || data;
      setDatasets(prev => Array.isArray(prev) ? [newDataset, ...prev] : [newDataset]);
      setSelectedDataset(newDataset);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const selectDataset = (ds) => {
    setSelectedDataset(ds);
    setSelected(ds);
    toast.success(`Selected: ${ds.originalName}`);
  };

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <h1 className="text-xl font-bold text-violet-100 mb-1">Upload Dataset</h1>
      <p className="text-violet-500 text-xs mb-6">Import CSV files for analysis</p>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all mb-6 ${
          dragging ? 'border-violet-500 bg-violet-900/20' : 'border-violet-800/40 hover:border-violet-600/60 bg-gray-900/30'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        <div className="text-4xl mb-3">{uploading ? '⟳' : '⬆'}</div>
        <p className="text-violet-300 font-medium text-sm">{uploading ? 'Uploading...' : 'Drop CSV here or click to browse'}</p>
        <p className="text-violet-600 text-xs mt-2">Max 50MB · CSV format only</p>
      </div>

      {/* Dataset list */}
      {datasets.length > 0 && (
        <div>
          <h2 className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-3">Your Datasets ({datasets.length})</h2>
          <div className="space-y-2">
            {datasets.map(ds => (
              <div key={ds._id}
                onClick={() => selectDataset(ds)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedDataset?._id === ds._id
                    ? 'border-violet-500/50 bg-violet-900/20'
                    : 'border-violet-900/20 bg-gray-900/30 hover:border-violet-700/40'
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-violet-200 text-sm font-medium">{ds.originalName}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-violet-500 text-xs">{ds.rows?.toLocaleString()} rows</span>
                      <span className="text-violet-500 text-xs">·</span>
                      <span className="text-violet-500 text-xs">{ds.columns?.length} columns</span>
                      <span className="text-violet-500 text-xs">·</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        ds.datasetType === 'classification' ? 'bg-violet-900/30 text-violet-300' : 'bg-blue-900/30 text-blue-300'
                      }`}>{ds.datasetType}</span>
                    </div>
                  </div>
                  {selectedDataset?._id === ds._id && <span className="text-violet-400 text-sm">✓ Active</span>}
                </div>
                {selectedDataset?._id === ds._id && ds.columns && (
                  <div className="mt-3 pt-3 border-t border-violet-800/20">
                    <p className="text-violet-500 text-xs mb-2">Columns:</p>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(ds.columns) && ds.columns.map(col => (
                        <span key={col} className="text-xs bg-violet-900/30 text-violet-300 px-2 py-0.5 rounded">{col}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview table */}
      {selectedDataset?.preview?.length > 0 && (
        <div className="mt-6">
          <h2 className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-3">Data Preview</h2>
          <div className="overflow-x-auto rounded-xl border border-violet-900/20">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-violet-900/20">
                  {Array.isArray(selectedDataset.columns) && selectedDataset.columns.map(col => (
                    <th key={col} className="px-3 py-2 text-left text-violet-300 font-medium whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedDataset.preview.slice(0, 8).map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-900/20' : 'bg-gray-900/40'}>
                    {Array.isArray(selectedDataset.columns) && selectedDataset.columns.map(col => (
                      <td key={col} className="px-3 py-2 text-violet-400 whitespace-nowrap">{String(row[col] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
