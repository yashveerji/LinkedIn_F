import React, { useContext, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { authDataContext } from '../context/AuthContext';

export default function ForgotPassword() {
  const { serverUrl } = useContext(authDataContext);
  const navigate = useNavigate();
  const [step, setStep] = useState('request'); // request | verify
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const sendOtp = async () => {
    setLoading(true); setErr(''); setMsg('');
    try {
      const res = await axios.post(serverUrl + '/api/auth/forgot-password', { email });
      if (res.data?.userId) setUserId(res.data.userId);
      setMsg('If the email exists, an OTP has been sent.');
      setStep('verify');
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const resetPwd = async () => {
    setLoading(true); setErr(''); setMsg('');
    try {
      await axios.post(serverUrl + '/api/auth/reset-password', { userId, otp, newPassword: newPwd });
      setMsg('Password reset successful. You can now log in.');
      setTimeout(() => navigate('/login'), 800);
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to reset password');
    }
    setLoading(false);
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot password</h1>
        <p className="text-sm text-gray-600 mb-6">Reset your password using the code sent to your email.</p>

        {msg && <div className="mb-3 text-green-600 text-sm">{msg}</div>}
        {err && <div className="mb-3 text-red-600 text-sm">{err}</div>}

        {step === 'request' && (
          <div>
            <label className="block text-sm text-gray-800 mb-1">Email</label>
            <input
              type="email"
              className="w-full h-11 border border-gray-300 rounded-lg px-3 text-gray-900 placeholder-gray-400"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              className="w-full h-11 mt-4 rounded-lg bg-gray-900 text-white font-semibold disabled:opacity-60"
              onClick={sendOtp}
              disabled={loading || !email}
            >
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
            <button
              type="button"
              className="w-full h-11 mt-2 rounded-lg border border-gray-300 text-gray-800"
              onClick={() => navigate('/login')}
            >
              Back to login
            </button>
          </div>
        )}

        {step === 'verify' && (
          <div>
            <label className="block text-sm text-gray-800 mb-1">OTP</label>
            <input
              type="text"
              className="w-full h-11 border border-gray-300 rounded-lg px-3 text-gray-900 placeholder-gray-400"
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <label className="block text-sm text-gray-800 mb-1 mt-3">New password</label>
            <input
              type="password"
              className="w-full h-11 border border-gray-300 rounded-lg px-3 text-gray-900 placeholder-gray-400"
              placeholder="At least 8 characters"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
            />
            <button
              className="w-full h-11 mt-4 rounded-lg bg-gray-900 text-white font-semibold disabled:opacity-60"
              onClick={resetPwd}
              disabled={loading || !otp || !newPwd}
            >
              {loading ? 'Resetting…' : 'Reset password'}
            </button>
            <button
              type="button"
              className="w-full h-11 mt-2 rounded-lg border border-gray-300 text-gray-800"
              onClick={() => setStep('request')}
            >
              Start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
