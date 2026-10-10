import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../i18n/index.js';

interface AuthViewProps {
  apiBase: string;
  onAuthSuccess: (token: string, user: any) => void;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'reset' | 'bootstrap';

export function AuthView({ apiBase, onAuthSuccess }: AuthViewProps) {
  const { t } = useTranslation(['auth', 'common', 'validation']);
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('My Local Hotspot');
  const [displayName, setDisplayName] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [bootstrapToken, setBootstrapToken] = useState('');
  const [isBootstrapOpen, setIsBootstrapOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${apiBase}/api/v1/health`)
      .then((r) => r.json())
      .then((data) => {
        if (data.adminBootstrapOpen) {
          setIsBootstrapOpen(true);
        }
      })
      .catch(() => {});
  }, [apiBase]);

  const clearForm = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const mapErrorMessage = (errCodeOrMsg: string) => {
    return t(errCodeOrMsg, { ns: 'validation', defaultValue: errCodeOrMsg });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.code || data.error?.message || 'INVALID_CREDENTIALS');
      }
      onAuthSuccess(data.token, data.owner);
    } catch (err: unknown) {
      setError(mapErrorMessage(err instanceof Error ? err.message : 'INVALID_CREDENTIALS'));
    } finally {
      setLoading(false);
    }
  };

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch', { ns: 'validation' }));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/v1/admin/bootstrap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          displayName: displayName || 'System Administrator',
          bootstrapToken: bootstrapToken || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.code || data.error?.message || 'BOOTSTRAP_FAILED');
      }
      setIsBootstrapOpen(false);
      onAuthSuccess(data.token, data.user);
    } catch (err: unknown) {
      setError(mapErrorMessage(err instanceof Error ? err.message : 'BOOTSTRAP_FAILED'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch', { ns: 'validation' }));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, businessName, displayName }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.code || data.error?.message || 'REGISTRATION_FAILED');
      }
      onAuthSuccess(data.token, data.owner);
    } catch (err: unknown) {
      setError(mapErrorMessage(err instanceof Error ? err.message : 'REGISTRATION_FAILED'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setSuccessMessage(t('resetEmailSent', { ns: 'auth' }));
      if (data.devResetToken) {
        setResetToken(data.devResetToken);
      }
    } catch (err: unknown) {
      setError(mapErrorMessage(err instanceof Error ? err.message : 'NETWORK_ERROR'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch', { ns: 'validation' }));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.code || data.error?.message || 'RESET_FAILED');
      }
      setSuccessMessage(t('resetSuccess', { ns: 'auth' }));
      setMode('login');
      setPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setError(mapErrorMessage(err instanceof Error ? err.message : 'RESET_FAILED'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: '1.5rem', background: 'var(--color-bg)' }}>
      <div
        style={{
          width: 'min(100%, 460px)',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
          padding: '2rem',
          position: 'relative',
        }}
      >
        {/* Language Selector Top Right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
          <LanguageSelector compact />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="logo" style={{ margin: '0 auto 1rem auto' }}>◉</div>
          <small style={{ color: 'var(--color-brand-secondary)', letterSpacing: '0.08em', fontWeight: 800 }}>
            {t('appName', { ns: 'common' }).toUpperCase()}
          </small>
          <h2 style={{ margin: '0.4rem 0 0.2rem', fontSize: '1.4rem' }}>
            {mode === 'login' && t('signIn', { ns: 'auth' })}
            {mode === 'register' && t('createAccount', { ns: 'auth' })}
            {mode === 'forgot' && t('forgotPassword', { ns: 'auth' })}
            {mode === 'reset' && t('resetPassword', { ns: 'auth' })}
            {mode === 'bootstrap' && t('bootstrapTitle', { ns: 'auth' })}
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', margin: 0 }}>
            {mode === 'login' && t('signInDesc', { ns: 'auth' })}
            {mode === 'register' && t('createAccountDesc', { ns: 'auth' })}
            {mode === 'forgot' && t('forgotPasswordDesc', { ns: 'auth' })}
            {mode === 'reset' && t('resetPasswordDesc', { ns: 'auth' })}
            {mode === 'bootstrap' && t('bootstrapDesc', { ns: 'auth' })}
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: 'var(--color-danger)', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', marginBottom: '1.25rem', border: '1px solid #fee2e2' }}>
            {error}
          </div>
        )}

        {successMessage && (
          <div style={{ background: '#ecfdf5', color: 'var(--color-success)', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', marginBottom: '1.25rem', border: '1px solid #d1fae5' }}>
            {successMessage}
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">{t('email', { ns: 'auth' })}</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder={t('emailPlaceholder', { ns: 'auth' })}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="login-password">{t('password', { ns: 'auth' })}</label>
                <button
                  type="button"
                  onClick={() => { clearForm(); setMode('forgot'); }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-brand-secondary)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                >
                  {t('forgotPasswordLink', { ns: 'auth' })}
                </button>
              </div>
              <div className="password-input-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('hidePassword', { ns: 'auth' }) : t('showPassword', { ns: 'auth' })}
                >
                  {showPassword ? t('hidePassword', { ns: 'auth' }) : t('showPassword', { ns: 'auth' })}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? t('loading', { ns: 'common' }) : t('signInBtn', { ns: 'auth' })}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">{t('businessName', { ns: 'auth' })}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t('businessNamePlaceholder', { ns: 'auth' })}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('displayName', { ns: 'auth' })}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t('displayNamePlaceholder', { ns: 'auth' })}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('email', { ns: 'auth' })}</label>
              <input
                type="email"
                className="form-input"
                placeholder={t('emailPlaceholder', { ns: 'auth' })}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('password', { ns: 'auth' })}</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder={t('passwordPlaceholder', { ns: 'auth' })}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? t('hidePassword', { ns: 'auth' }) : t('showPassword', { ns: 'auth' })}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('confirmPassword', { ns: 'auth' })}</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <button type="submit" className="btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? t('loading', { ns: 'common' }) : t('registerBtn', { ns: 'auth' })}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword}>
            <div className="form-group">
              <label className="form-label">{t('email', { ns: 'auth' })}</label>
              <input
                type="email"
                className="form-input"
                placeholder={t('emailPlaceholder', { ns: 'auth' })}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? t('loading', { ns: 'common' }) : t('sendResetLink', { ns: 'auth' })}
            </button>

            {resetToken && (
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => { clearForm(); setMode('reset'); }}
                  style={{ width: '100%' }}
                >
                  {t('resetPassword', { ns: 'auth' })}
                </button>
              </div>
            )}
          </form>
        )}

        {/* RESET PASSWORD FORM */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label">{t('resetToken', { ns: 'auth' })}</label>
              <input
                type="text"
                className="form-input"
                placeholder="token..."
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('newPassword', { ns: 'auth' })}</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder={t('passwordPlaceholder', { ns: 'auth' })}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('confirmPassword', { ns: 'auth' })}</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? t('loading', { ns: 'common' }) : t('resetPasswordBtn', { ns: 'auth' })}
            </button>
          </form>
        )}

        {/* BOOTSTRAP SUPERADMIN FORM */}
        {mode === 'bootstrap' && (
          <form onSubmit={handleBootstrap}>
            <div style={{ background: '#eff6ff', color: '#1e40af', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', marginBottom: '1rem', border: '1px solid #dbeafe' }}>
              <strong>First-Run Mode:</strong> {t('bootstrapDesc', { ns: 'auth' })}
            </div>

            <div className="form-group">
              <label className="form-label">{t('email', { ns: 'auth' })}</label>
              <input
                type="email"
                className="form-input"
                placeholder="admin@yourhotspot.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('displayName', { ns: 'auth' })}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t('displayNamePlaceholder', { ns: 'auth' })}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('password', { ns: 'auth' })}</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder={t('passwordPlaceholder', { ns: 'auth' })}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? t('hidePassword', { ns: 'auth' }) : t('showPassword', { ns: 'auth' })}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('confirmPassword', { ns: 'auth' })}</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('bootstrapToken', { ns: 'auth' })}</label>
              <input
                type="password"
                className="form-input"
                placeholder={t('bootstrapTokenPlaceholder', { ns: 'auth' })}
                value={bootstrapToken}
                onChange={(e) => setBootstrapToken(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? t('loading', { ns: 'common' }) : t('bootstrapBtn', { ns: 'auth' })}
            </button>
          </form>
        )}

        {/* Footer Navigation */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)', textAlign: 'center', fontSize: '0.85rem' }}>
          {mode === 'login' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => { clearForm(); setMode('register'); }}
                style={{ background: 'none', border: 'none', color: 'var(--color-brand-secondary)', cursor: 'pointer', fontWeight: 600 }}
              >
                {t('needAccount', { ns: 'auth' })}
              </button>
              {isBootstrapOpen && (
                <button
                  type="button"
                  onClick={() => { clearForm(); setMode('bootstrap'); }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-warning, #d97706)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  ⚙ {t('bootstrapTitle', { ns: 'auth' })}
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { clearForm(); setMode('login'); }}
              style={{ background: 'none', border: 'none', color: 'var(--color-brand-secondary)', cursor: 'pointer', fontWeight: 600 }}
            >
              ← {t('backToSignIn', { ns: 'auth' })}
            </button>
          )}
        </div>

        {/* Security Notice */}
        <div style={{ marginTop: '1.25rem', textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.72rem' }}>
          Protected by server-authoritative PBKDF2 hashing &amp; progressive anti-automation rate limiting.
        </div>
      </div>
    </div>
  );
}
