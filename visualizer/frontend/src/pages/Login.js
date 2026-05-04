import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      login(data.data.user, data.data.token);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-900 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">ML</div>
          <h1 className="text-2xl font-bold text-violet-100">VizLearn</h1>
          <p className="text-violet-400 text-sm mt-1">Machine Learning Visualization Platform</p>
        </div>

        <div className="bg-gray-900/60 border border-violet-900/30 rounded-2xl p-8 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-violet-200 mb-6">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-violet-400 text-xs mb-2 tracking-wider uppercase">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required
                className="w-full bg-slate-900/80 border border-violet-800/40 rounded-lg px-4 py-3 text-violet-100 text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-violet-700"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-violet-400 text-xs mb-2 tracking-wider uppercase">Password</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required
                className="w-full bg-slate-900/80 border border-violet-800/40 rounded-lg px-4 py-3 text-violet-100 text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-violet-700"
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50 mt-2">
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
          <p className="text-center text-violet-500 text-xs mt-6">
            No account? <Link to="/signup" className="text-violet-300 hover:text-violet-100">Create one</Link>
          </p>
          <div className="mt-4 p-3 bg-violet-900/20 rounded-lg border border-violet-800/30">
            <p className="text-violet-400 text-xs text-center">Demo: demo@ml.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
