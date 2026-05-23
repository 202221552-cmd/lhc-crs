import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, User, Eye, EyeOff } from 'lucide-react';

export const LoginPage = () => {
  const { login, centerName } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const triggerErrorShake = () => {
    setIsError(true);
    setTimeout(() => setIsError(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      triggerErrorShake();
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
      triggerErrorShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className={`login-card fade-in ${isError ? 'shake-error' : ''}`}>
        <div className="login-logo">
          <GraduationCap size={36} />
        </div>
        <h1>{centerName}</h1>
        <p className="login-subtitle">نظام إدارة الدورات والتسجيل</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <User size={14} style={{ display: 'inline', marginLeft: '4px' }} />
              اسم المستخدم
            </label>
            <input
              type="text"
              className="glass-input"
              placeholder="أدخل اسم المستخدم..."
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={14} style={{ display: 'inline', marginLeft: '4px' }} />
              كلمة المرور
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="glass-input"
                placeholder="أدخل كلمة المرور..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px'
                }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="glass-btn"
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div style={{ marginTop: '28px', padding: '14px', background: 'var(--primary-light)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
          <strong>بيانات الدخول:</strong><br />
          👑 مسؤول كامل: <strong>admin</strong> / <strong>102030.55</strong><br />
          📋 مسجّل: registrar / 123456<br />
          💰 محاسب: accountant / 123456
        </div>
      </div>
    </div>
  );
};
