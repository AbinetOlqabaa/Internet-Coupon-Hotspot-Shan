import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { formatTime, formatDurationClock } from '../i18n/index.js';
import type { SupportedLocale } from '../i18n/types.js';

const API = import.meta.env.VITE_API_BASE_URL ?? '';

interface SessionItem {
  id: string;
  ownerId: string;
  customerId?: string | null;
  packageId: string;
  status: 'created' | 'awaiting_payment' | 'payment_verified' | 'activation_pending' | 'active' | 'expired' | 'activation_failed' | 'paused' | 'revoked' | 'cancelled';
  durationSeconds: number;
  remainingSeconds: number;
  activatedAt?: string | null;
  expiresAt?: string | null;
  deviceMac?: string | null;
  clientIp?: string | null;
  createdAt: string;
}

interface PackageItem {
  id: string;
  name: string;
  durationSeconds: number;
  price: { amountMinor: number; currency: string };
}

interface SessionsViewProps {
  token: string;
  packages: PackageItem[];
  onFeedback: (message: string, type: 'success' | 'error') => void;
}

export function SessionsView({ token, packages, onFeedback }: SessionsViewProps) {
  const { t, i18n } = useTranslation(['sessions', 'common', 'validation']);
  const currentLang = (i18n.language as SupportedLocale) || 'en';

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isReconciling, setIsReconciling] = useState(false);

  // New Session Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createPkgId, setCreatePkgId] = useState('');
  const [createMac, setCreateMac] = useState('');
  const [createIp, setCreateIp] = useState('');
  const [createInitialStatus, setCreateInitialStatus] = useState<'awaiting_payment' | 'payment_verified'>('payment_verified');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Extend Modal State
  const [extendSessionId, setExtendSessionId] = useState<string | null>(null);
  const [extendSeconds, setExtendSeconds] = useState<number>(1800);
  const [extendSubmitting, setExtendSubmitting] = useState(false);

  // Pause & Revoke Modal State
  const [pauseSessionId, setPauseSessionId] = useState<string | null>(null);
  const [pauseReason, setPauseReason] = useState('Customer requested pause');
  const [revokeSessionId, setRevokeSessionId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('Administrative revocation');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'all'
        ? `${API}/api/v1/sessions`
        : `${API}/api/v1/sessions?status=${encodeURIComponent(statusFilter)}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {
      onFeedback(t('NETWORK_ERROR', { ns: 'validation' }), 'error');
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, t]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Real-time ticking clock for active sessions
  useEffect(() => {
    const timer = setInterval(() => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.status === 'active' && s.remainingSeconds > 0) {
            const nextRemaining = s.remainingSeconds - 1;
            if (nextRemaining <= 0) {
              return { ...s, remainingSeconds: 0, status: 'expired' };
            }
            return { ...s, remainingSeconds: nextRemaining };
          }
          return s;
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleActivate = async (sessionId: string) => {
    try {
      const res = await fetch(`${API}/api/v1/sessions/${sessionId}/activate`, {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (res.ok) {
        onFeedback(`Session activated (${data.session.durationSeconds}s)`, 'success');
        loadSessions();
      } else {
        onFeedback(data.error?.message || t('SERVER_ERROR', { ns: 'validation' }), 'error');
      }
    } catch {
      onFeedback(t('NETWORK_ERROR', { ns: 'validation' }), 'error');
    }
  };

  const handleExtend = async () => {
    if (!extendSessionId) return;
    setExtendSubmitting(true);
    try {
      const res = await fetch(`${API}/api/v1/sessions/${extendSessionId}/extend`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ additionalSeconds: extendSeconds }),
      });
      const data = await res.json();
      if (res.ok) {
        onFeedback(`Session extended by ${Math.round(extendSeconds / 60)} minutes`, 'success');
        setExtendSessionId(null);
        loadSessions();
      } else {
        onFeedback(data.error?.message || t('SERVER_ERROR', { ns: 'validation' }), 'error');
      }
    } catch {
      onFeedback(t('NETWORK_ERROR', { ns: 'validation' }), 'error');
    } finally {
      setExtendSubmitting(false);
    }
  };

  const handlePause = async () => {
    if (!pauseSessionId) return;
    try {
      const res = await fetch(`${API}/api/v1/sessions/${pauseSessionId}/pause`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: pauseReason }),
      });
      const data = await res.json();
      if (res.ok) {
        onFeedback('Session paused.', 'success');
        setPauseSessionId(null);
        loadSessions();
      } else {
        onFeedback(data.error?.message || t('SERVER_ERROR', { ns: 'validation' }), 'error');
      }
    } catch {
      onFeedback(t('NETWORK_ERROR', { ns: 'validation' }), 'error');
    }
  };

  const handleResume = async (sessionId: string) => {
    try {
      const res = await fetch(`${API}/api/v1/sessions/${sessionId}/resume`, {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (res.ok) {
        onFeedback('Session resumed.', 'success');
        loadSessions();
      } else {
        onFeedback(data.error?.message || t('SERVER_ERROR', { ns: 'validation' }), 'error');
      }
    } catch {
      onFeedback(t('NETWORK_ERROR', { ns: 'validation' }), 'error');
    }
  };

  const handleRevoke = async () => {
    if (!revokeSessionId) return;
    try {
      const res = await fetch(`${API}/api/v1/sessions/${revokeSessionId}/revoke`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: revokeReason }),
      });
      const data = await res.json();
      if (res.ok) {
        onFeedback('Session revoked.', 'success');
        setRevokeSessionId(null);
        loadSessions();
      } else {
        onFeedback(data.error?.message || t('SERVER_ERROR', { ns: 'validation' }), 'error');
      }
    } catch {
      onFeedback(t('NETWORK_ERROR', { ns: 'validation' }), 'error');
    }
  };

  const handleReconcileExpiry = async () => {
    setIsReconciling(true);
    try {
      const res = await fetch(`${API}/api/v1/sessions/reconcile-expiry`, {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (res.ok) {
        onFeedback(t('clocksReconciled', { ns: 'sessions' }), 'success');
        loadSessions();
      } else {
        onFeedback(data.error?.message || t('SERVER_ERROR', { ns: 'validation' }), 'error');
      }
    } catch {
      onFeedback(t('NETWORK_ERROR', { ns: 'validation' }), 'error');
    } finally {
      setIsReconciling(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createPkgId) {
      onFeedback(t('selectPackage', { ns: 'sessions' }), 'error');
      return;
    }
    setCreateSubmitting(true);
    try {
      const res = await fetch(`${API}/api/v1/sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          packageId: createPkgId,
          deviceMac: createMac || undefined,
          clientIp: createIp || undefined,
          initialStatus: createInitialStatus,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onFeedback(`Access session created [${data.session.id.substring(0, 8)}]`, 'success');
        setShowCreateModal(false);
        setCreateMac('');
        setCreateIp('');
        loadSessions();
      } else {
        onFeedback(data.error?.message || t('SERVER_ERROR', { ns: 'validation' }), 'error');
      }
    } catch {
      onFeedback(t('NETWORK_ERROR', { ns: 'validation' }), 'error');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-active">{t('active', { ns: 'common' })}</span>;
      case 'paused':
        return <span className="badge badge-inactive">{t('paused', { ns: 'common' })}</span>;
      case 'expired':
        return <span className="badge badge-inactive">{t('expired', { ns: 'common' })}</span>;
      case 'payment_verified':
        return <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8' }}>{t('paymentVerified', { ns: 'sessions' })}</span>;
      default:
        return <span className="badge badge-inactive">{status}</span>;
    }
  };

  const activeCount = sessions.filter((s) => s.status === 'active').length;
  const pausedCount = sessions.filter((s) => s.status === 'paused').length;
  const pendingCount = sessions.filter((s) => s.status === 'payment_verified' || s.status === 'awaiting_payment').length;
  const expiredCount = sessions.filter((s) => s.status === 'expired' || s.status === 'revoked').length;

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <small style={{ color: 'var(--color-brand-secondary)', letterSpacing: '0.08em', fontWeight: 800 }}>
            {t('title', { ns: 'sessions' }).toUpperCase()}
          </small>
          <h2 style={{ margin: '0.25rem 0 0 0', fontSize: '1.35rem' }}>{t('title', { ns: 'sessions' })}</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-muted)', fontSize: '0.85rem' }}>
            {t('subtitle', { ns: 'sessions' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-outline"
            onClick={handleReconcileExpiry}
            disabled={isReconciling}
          >
            {isReconciling ? t('loading', { ns: 'common' }) : t('reconcileClocks', { ns: 'sessions' })}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              if (packages.length > 0 && !createPkgId) {
                setCreatePkgId(packages[0].id);
              }
              setShowCreateModal(true);
            }}
          >
            + {t('newSession', { ns: 'sessions' })}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <article className="card" style={{ padding: '1rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-success)' }}>{activeCount} {t('active', { ns: 'common' })}</h3>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--color-muted)', fontSize: '0.8rem' }}>Live countdown clocks running</p>
        </article>
        <article className="card" style={{ padding: '1rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#b45309' }}>{pausedCount} {t('paused', { ns: 'common' })}</h3>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--color-muted)', fontSize: '0.8rem' }}>Duration clocks frozen</p>
        </article>
        <article className="card" style={{ padding: '1rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1d4ed8' }}>{pendingCount} {t('pending', { ns: 'common' })}</h3>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--color-muted)', fontSize: '0.8rem' }}>Awaiting gateway lease</p>
        </article>
        <article className="card" style={{ padding: '1rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#6b7280' }}>{expiredCount} {t('expired', { ns: 'common' })}</h3>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--color-muted)', fontSize: '0.8rem' }}>Expired or revoked sessions</p>
        </article>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['all', 'active', 'paused', 'payment_verified', 'expired'].map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={`btn-outline ${statusFilter === filter ? 'btn-primary' : ''}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
          >
            {filter === 'all' ? t('all', { ns: 'common' }) : t(filter, { ns: 'common', defaultValue: filter })}
          </button>
        ))}
      </div>

      {/* Sessions Table */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)', overflowX: 'auto', boxShadow: 'var(--shadow-card)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t('status', { ns: 'sessions' })}</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t('remainingTime', { ns: 'sessions' })}</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t('clientDevice', { ns: 'sessions' })}</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t('package', { ns: 'sessions' })}</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t('expiresAt', { ns: 'sessions' })}</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>{t('actions', { ns: 'common' })}</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)' }}>
                  {loading ? t('loading', { ns: 'common' }) : t('noActiveSessions', { ns: 'sessions' })}
                </td>
              </tr>
            ) : (
              sessions.map((s) => {
                const pkg = packages.find((p) => p.id === s.packageId);
                const isLive = s.status === 'active';
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {getStatusBadge(s.status)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          fontWeight: isLive ? 700 : 500,
                          color: isLive ? 'var(--color-success)' : s.status === 'paused' ? '#b45309' : 'var(--color-muted)',
                          fontFamily: 'monospace',
                          fontSize: '0.95rem',
                        }}
                      >
                        {formatDurationClock(s.remainingSeconds)}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>
                      {s.deviceMac || <span style={{ color: 'var(--color-muted)' }}>Unassigned</span>}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {pkg?.name || s.packageId.substring(0, 8)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-muted)', fontSize: '0.78rem' }}>
                      {s.expiresAt ? formatTime(s.expiresAt, currentLang) : 'N/A'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        {s.status === 'payment_verified' && (
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => handleActivate(s.id)}
                          >
                            {t('createSubmit', { ns: 'sessions' })}
                          </button>
                        )}
                        {s.status === 'active' && (
                          <>
                            <button
                              type="button"
                              className="btn-outline"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => setExtendSessionId(s.id)}
                            >
                              + {t('extendSession', { ns: 'sessions' })}
                            </button>
                            <button
                              type="button"
                              className="btn-outline"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => { setPauseSessionId(s.id); }}
                            >
                              ⏸ {t('pauseSession', { ns: 'sessions' })}
                            </button>
                          </>
                        )}
                        {s.status === 'paused' && (
                          <button
                            type="button"
                            className="btn-outline"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--color-success)' }}
                            onClick={() => handleResume(s.id)}
                          >
                            ▶ {t('resumeSession', { ns: 'sessions' })}
                          </button>
                        )}
                        {(s.status === 'active' || s.status === 'paused') && (
                          <button
                            type="button"
                            className="btn-outline"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--color-danger)' }}
                            onClick={() => setRevokeSessionId(s.id)}
                          >
                            ✕ {t('revokeSession', { ns: 'sessions' })}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: CREATE SESSION */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>{t('createModalTitle', { ns: 'sessions' })}</h3>
            <form onSubmit={handleCreateSession}>
              <div className="form-group">
                <label className="form-label">{t('selectPackage', { ns: 'sessions' })}</label>
                <select
                  className="form-input"
                  value={createPkgId}
                  onChange={(e) => setCreatePkgId(e.target.value)}
                  required
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({Math.round(p.durationSeconds / 60)} mins)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('macLabel', { ns: 'sessions' })}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('macPlaceholder', { ns: 'sessions' })}
                  value={createMac}
                  onChange={(e) => setCreateMac(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('ipLabel', { ns: 'sessions' })}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('ipPlaceholder', { ns: 'sessions' })}
                  value={createIp}
                  onChange={(e) => setCreateIp(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('initialStatus', { ns: 'sessions' })}</label>
                <select
                  className="form-input"
                  value={createInitialStatus}
                  onChange={(e) => setCreateInitialStatus(e.target.value as any)}
                >
                  <option value="payment_verified">{t('paymentVerified', { ns: 'sessions' })}</option>
                  <option value="awaiting_payment">{t('awaitingPayment', { ns: 'sessions' })}</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn-outline" onClick={() => setShowCreateModal(false)}>
                  {t('cancel', { ns: 'common' })}
                </button>
                <button type="submit" className="btn-primary" disabled={createSubmitting}>
                  {createSubmitting ? t('loading', { ns: 'common' }) : t('createSubmit', { ns: 'sessions' })}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXTEND SESSION */}
      {extendSessionId && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>{t('extendModalTitle', { ns: 'sessions' })}</h3>
            <div className="form-group">
              <label className="form-label">{t('addMinutes', { ns: 'sessions' })}</label>
              <select
                className="form-input"
                value={extendSeconds}
                onChange={(e) => setExtendSeconds(Number(e.target.value))}
              >
                <option value={900}>15 Minutes</option>
                <option value={1800}>30 Minutes</option>
                <option value={3600}>1 Hour (60 mins)</option>
                <option value={7200}>2 Hours</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn-outline" onClick={() => setExtendSessionId(null)}>
                {t('cancel', { ns: 'common' })}
              </button>
              <button type="button" className="btn-primary" onClick={handleExtend} disabled={extendSubmitting}>
                {extendSubmitting ? t('loading', { ns: 'common' }) : t('confirmExtend', { ns: 'sessions' })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PAUSE SESSION */}
      {pauseSessionId && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>{t('pauseModalTitle', { ns: 'sessions' })}</h3>
            <div className="form-group">
              <label className="form-label">{t('pauseReason', { ns: 'sessions' })}</label>
              <input
                type="text"
                className="form-input"
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn-outline" onClick={() => setPauseSessionId(null)}>
                {t('cancel', { ns: 'common' })}
              </button>
              <button type="button" className="btn-primary" onClick={handlePause}>
                {t('confirmPause', { ns: 'sessions' })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REVOKE SESSION */}
      {revokeSessionId && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>{t('revokeModalTitle', { ns: 'sessions' })}</h3>
            <div className="form-group">
              <label className="form-label">{t('revokeReason', { ns: 'sessions' })}</label>
              <input
                type="text"
                className="form-input"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn-outline" onClick={() => setRevokeSessionId(null)}>
                {t('cancel', { ns: 'common' })}
              </button>
              <button type="button" className="btn-danger" onClick={handleRevoke}>
                {t('confirmRevoke', { ns: 'sessions' })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
