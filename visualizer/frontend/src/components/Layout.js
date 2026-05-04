import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDataset } from '../context/DatasetContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '⬡' },
  { path: '/upload', label: 'Upload Dataset', icon: '⬆' },
  { path: '/profiling', label: 'Dataset Profiling', icon: '◈' },
  { path: '/preprocessing', label: 'Preprocessing', icon: '⧩' },
  { path: '/split', label: 'Train/Test Split', icon: '⊘' },
  { path: '/train', label: 'Train Model', icon: '⬟' },
  { path: '/metrics', label: 'Metrics', icon: '◉' },
  { path: '/compare', label: 'Model Comparison', icon: '⊞' },
  { path: '/history', label: 'Experiments', icon: '⊟' },
  { path: '/report', label: 'Download Report', icon: '⬒' },
  { path: '/about', label: 'About Us', icon: 'ℹ' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { selectedDataset, darkMode, setDarkMode } = useDataset();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'bg-gray-950' : 'bg-slate-950'}`} style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-60'} transition-all duration-300 flex flex-col border-r border-violet-900/30 bg-gray-950/80 backdrop-blur-xl`}>
        <div className="p-4 border-b border-violet-900/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">ML</div>
          {!collapsed && <span className="text-violet-300 font-semibold text-sm tracking-wider">VIZLEARN</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-violet-500 hover:text-violet-300 text-xs">
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        {!collapsed && selectedDataset && (
          <div className="mx-3 mt-3 p-2 rounded-lg bg-violet-900/20 border border-violet-800/30">
            <p className="text-violet-400 text-xs">Active Dataset</p>
            <p className="text-violet-200 text-xs font-medium truncate">{selectedDataset.originalName}</p>
            <div className="flex gap-2 mt-1">
              <span className="text-xs text-violet-500">{selectedDataset.rows} rows</span>
              <span className="text-xs text-violet-500">·</span>
              <span className="text-xs text-violet-500">{selectedDataset.columns?.length} cols</span>
            </div>
          </div>
        )}

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg mb-0.5 text-sm transition-all duration-200 group ${
                isActive
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-600/30'
                  : 'text-slate-400 hover:text-violet-300 hover:bg-violet-900/10'
              }`}>
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="text-xs tracking-wide">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-violet-900/30">
          {!collapsed && (
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-violet-200 text-xs font-medium truncate">{user?.name}</p>
                <p className="text-violet-500 text-xs truncate">{user?.email}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button onClick={() => setDarkMode(!darkMode)}
              className="flex-1 text-xs text-violet-400 hover:text-violet-200 py-1.5 px-2 rounded border border-violet-800/30 hover:border-violet-600/50 transition-all">
              {darkMode ? '☀' : '◑'}
            </button>
            <button onClick={handleLogout}
              className="flex-1 text-xs text-red-400 hover:text-red-200 py-1.5 px-2 rounded border border-red-900/30 hover:border-red-600/50 transition-all">
              {collapsed ? '⇥' : 'Logout'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-950 via-gray-950 to-violet-950/20">
        <div className="min-h-full p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
