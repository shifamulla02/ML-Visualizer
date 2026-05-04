import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DatasetProvider } from './context/DatasetContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import UploadDataset from './pages/UploadDataset';
import DatasetProfiling from './pages/DatasetProfiling';
import PreprocessingPipeline from './pages/PreprocessingPipeline';
import TrainTestSplit from './pages/TrainTestSplit';
import TrainModel from './pages/TrainModel';
import MetricsVisualization from './pages/MetricsVisualization';
import ModelComparison from './pages/ModelComparison';
import ExperimentHistory from './pages/ExperimentHistory';
import DownloadReport from './pages/DownloadReport';
import AboutUs from './pages/AboutUs';

export default function App() {
  return (
    <AuthProvider>
      <DatasetProvider>
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Toaster position="top-right" toastOptions={{
            style: { background: '#1e1b4b', color: '#e2e8f0', border: '1px solid #4c1d95' },
            success: { iconTheme: { primary: '#8b5cf6', secondary: '#fff' } }
          }} />
          <Routes>
            <Route path="/about" element={<AboutUs />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="upload" element={<UploadDataset />} />
              <Route path="profiling" element={<DatasetProfiling />} />
              <Route path="preprocessing" element={<PreprocessingPipeline />} />
              <Route path="split" element={<TrainTestSplit />} />
              <Route path="train" element={<TrainModel />} />
              <Route path="metrics" element={<MetricsVisualization />} />
              <Route path="compare" element={<ModelComparison />} />
              <Route path="history" element={<ExperimentHistory />} />
              <Route path="report" element={<DownloadReport />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </DatasetProvider>
    </AuthProvider>
  );
}
