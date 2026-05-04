import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Validate password complexity
  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/\d/.test(password)) errors.push('One number');
    if (!/[@$!%*?&]/.test(password)) errors.push('One special char (@$!%*?&)');
    return errors;
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setForm({ ...form, password });
    if (password) {
      setPasswordErrors(validatePassword(password));
    } else {
      setPasswordErrors([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password requirements
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    const errors = validatePassword(form.password);
    if (errors.length > 0) {
      toast.error(`Password needs: ${errors.join(', ')}`);
      return;
    }

    // Validate passwords match
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate email format
    if (!form.email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authAPI.signup({
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      console.log('Signup response:', data);
      login(data.data.user, data.data.token);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      console.error('Signup error:', err);
      console.error('Error response:', err.response?.data);
      
      let errorMsg = 'Signup failed';
      
      if (err.response?.data?.details && Array.isArray(err.response.data.details)) {
        // Handle validation errors
        errorMsg = err.response.data.details.map(d => d.message).join(', ');
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      console.error('Final error message:', errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const allRequirementsMet = form.password && validatePassword(form.password).length === 0;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-900 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">ML</div>
          <h1 className="text-2xl font-bold text-violet-100">VizLearn</h1>
          <p className="text-violet-400 text-sm mt-1">Machine Learning Visualization Platform</p>
        </div>
        <div className="bg-gray-900/60 border border-violet-900/30 rounded-2xl p-8 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-violet-200 mb-6">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-violet-400 text-xs mb-2 tracking-wider uppercase">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                className="w-full bg-slate-900/80 border border-violet-800/40 rounded-lg px-4 py-3 text-violet-100 text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-violet-700"
                placeholder="Your name"
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-violet-400 text-xs mb-2 tracking-wider uppercase">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                className="w-full bg-slate-900/80 border border-violet-800/40 rounded-lg px-4 py-3 text-violet-100 text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-violet-700"
                placeholder="you@example.com"
              />
            </div>

            {/* Password Field with Requirements */}
            <div>
              <label className="block text-violet-400 text-xs mb-2 tracking-wider uppercase">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={handlePasswordChange}
                required
                className="w-full bg-slate-900/80 border border-violet-800/40 rounded-lg px-4 py-3 text-violet-100 text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-violet-700"
                placeholder="••••••••"
              />
              {/* Password Requirements */}
              {form.password && (
                <div className="mt-3 p-3 bg-slate-900 border border-violet-900/40 rounded-lg">
                  <p className="text-violet-400 text-xs font-semibold mb-2">Password Requirements:</p>
                  <ul className="space-y-1 text-xs">
                    <li className={form.password.length >= 8 ? 'text-green-400' : 'text-violet-500'}>
                      {form.password.length >= 8 ? '✓' : '○'} At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(form.password) ? 'text-green-400' : 'text-violet-500'}>
                      {/[A-Z]/.test(form.password) ? '✓' : '○'} One uppercase letter (A-Z)
                    </li>
                    <li className={/[a-z]/.test(form.password) ? 'text-green-400' : 'text-violet-500'}>
                      {/[a-z]/.test(form.password) ? '✓' : '○'} One lowercase letter (a-z)
                    </li>
                    <li className={/\d/.test(form.password) ? 'text-green-400' : 'text-violet-500'}>
                      {/\d/.test(form.password) ? '✓' : '○'} One number (0-9)
                    </li>
                    <li className={/[@$!%*?&]/.test(form.password) ? 'text-green-400' : 'text-violet-500'}>
                      {/[@$!%*?&]/.test(form.password) ? '✓' : '○'} One special char (@$!%*?&)
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-violet-400 text-xs mb-2 tracking-wider uppercase">Confirm Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                required
                className="w-full bg-slate-900/80 border border-violet-800/40 rounded-lg px-4 py-3 text-violet-100 text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-violet-700"
                placeholder="••••••••"
              />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
              {form.confirmPassword && form.password === form.confirmPassword && (
                <p className="text-green-400 text-xs mt-1">✓ Passwords match</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !allRequirementsMet || form.password !== form.confirmPassword}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? 'Creating...' : 'Create Account →'}
            </button>
          </form>
          <p className="text-center text-violet-500 text-xs mt-6">
            Have account? <Link to="/login" className="text-violet-300 hover:text-violet-100">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
