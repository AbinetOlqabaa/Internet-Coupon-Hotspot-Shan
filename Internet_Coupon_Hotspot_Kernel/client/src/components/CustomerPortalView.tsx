import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PWAInstallButton } from './PWAInstallButton.js';
import { OfflineIndicator } from './OfflineIndicator.js';
import { LanguageSelector, formatTime, formatDurationClock } from '../i18n/index.js';
import type { SupportedLocale } from '../i18n/types.js';

const API = import.meta.env.VITE_API_BASE_URL ?? '';

interface PublicSessionData {
  id: string;
  status: 'created' | 'awaiting_payment' | 'payment_verified' | 'activation_pending' | 'active' | 'expired' | 'activation_failed' | 'paused' | 'revoked' | 'cancelled';
  durationSeconds: number;
  remainingSeconds: number;
  activatedAt?: string | null;
  expiresAt?: string | null;
  deviceMac?: string | null;
  packageName?: string;
}

interface CustomerPortalViewProps {
  ownerId?: string;
  businessName?: string;
  onFeedback: (message: string, type: 'success' | 'error') => void;
}

export function CustomerPortalView({ ownerId, businessName, onFeedback }: CustomerPortalViewProps) {
  const { t, i18n } = useTranslation(['portal', 'common', 'validation']);
  const currentLang = (i18n.language as SupportedLocale) || 'en';

  const [voucherCode, setVoucherCode] = useState('');
  const [deviceMac, setDeviceMac] = useState('AA:BB:CC:DD:EE:FF');
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Active Customer Session
  const [activeSession, setActiveSession] = useState<PublicSessionData | null>(() => {
    const saved = localStorage.getItem('hotspot_customer_session');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const [polling, setPolling] = useState(false);

  // Poll public session status from server
  const pollSession = async (sessionId: string) => {
    setPolling(true);
    try {
      const res = await fetch(`${API}/api/v1/sessions/public/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data.session);
        localStorage.setItem('hotspot_customer_session', JSON.stringify(data.session));
      } else if (res.status === 404) {
        onFeedback(t('sessionNotFound', { ns: 'portal' }), 'error');
        setActiveSession(null);
        localStorage.removeItem('hotspot_customer_session');
      }
    } catch {
      onFeedback(t('NETWORK_ERROR', { ns: 'validation' }), 'error');
    } finally {
      setPolling(false);
    }
  };

  // Real-time local countdown clock for active session
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'active') return;

    const interval = setInterval(() => {
      setActiveSession((prev) => {
        if (!prev || prev.status !== 'active' || prev.remainingSeconds <= 0) return prev;
        const nextSecs = prev.remainingSeconds - 1;
        if (nextSecs <= 0) {
          return { ...prev, remainingSeconds: 0, status: 'expired' };
        }
        return { ...prev, remainingSeconds: nextSecs };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession?.status]);

  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) {
      onFeedback(t('voucherRequired', { ns: 'validation' }), 'error');
      return;
    }

    if (!ownerId) {
      onFeedback(t('ownerContextMissing', { ns: 'validation' }), 'error');
      return;
    }

    setIsRedeeming(true);
    try {
      const res = await fetch(`${API}/api/v1/sessions/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId,
          code: voucherCode.trim().toUpperCase(),
          deviceMac: deviceMac || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveSession(data.session);
        localStorage.setItem('hotspot_customer_session', JSON.stringify(data.session));
        onFeedback(t('redeemSuccess', { ns: 'portal', packageName: data.packageName }), 'success');
        setVoucherCode('');
      } else {
        const errKey = data.error?.code || data.error?.message || 'COUPON_NOT_FOUND';
        onFeedback(t(errKey, { ns: 'validation', defaultValue: data.error?.message }), 'error');
      }
    } catch {
      onFeedback(t('NETWORK_ERROR', { ns: 'validation' }), 'error');
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleDisconnectLocal = () => {
    setActiveSession(null);
    localStorage.removeItem('hotspot_customer_session');
    onFeedback(t('sessionCleared', { ns: 'portal' }), 'success');
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Mobile-Friendly Captive Portal Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-brand-primary), #1e3a8a)',
          color: 'white',
          borderRadius: 'var(--radius-card)',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '1.5rem',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
          <LanguageSelector compact />
        </div>

        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📶</span>
        <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem' }}>
          {businessName || t('portalTitle', { ns: 'portal' })}
        </h2>
        <p style={{ margin: '0 0 1rem 0', opacity: 0.85, fontSize: '0.9rem' }}>
          {t('portalSubtitle', { ns: 'portal' })}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <PWAInstallButton compact />
        </div>
      </div>
      <OfflineIndicator />

      {/* ACTIVE SESSION CARD */}
      {activeSession ? (
        <div
          style={{
            background: 'white',
            borderRadius: 'var(--radius-card)',
            padding: '1.5rem',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-brand-primary)' }}>
              {activeSession.packageName || t('activePass', { ns: 'portal' })}
            </span>
            <span
              className={`badge ${
                activeSession.status === 'active'
                  ? 'badge-active'
                  : 'badge-inactive'
              }`}
              style={{
                background:
                  activeSession.status === 'active'
                    ? '#dcfce7'
                    : activeSession.status === 'paused'
                    ? '#fef3c7'
                    : '#fee2e2',
                color:
                  activeSession.status === 'active'
                    ? '#166534'
                    : activeSession.status === 'paused'
                    ? '#92400e'
                    : '#991b1b',
              }}
            >
              {t(activeSession.status, { ns: 'common' }).toUpperCase()}
            </span>
          </div>

          {/* Large Countdown Display */}
          <div
            style={{
              background: 'var(--color-bg)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              textAlign: 'center',
              marginBottom: '1.25rem',
              border: '1px solid var(--color-border)',
            }}
          >
            <small style={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', fontWeight: 700 }}>
              {t('remainingTime', { ns: 'portal' })}
            </small>
            <div
              style={{
                fontSize: '2.5rem',
                fontFamily: 'monospace',
                fontWeight: 800,
                color:
                  activeSession.status === 'active'
                    ? 'var(--color-success)'
                    : activeSession.status === 'paused'
                    ? '#b45309'
                    : 'var(--color-danger)',
                margin: '0.25rem 0',
              }}
            >
              {formatDurationClock(activeSession.remainingSeconds)}
            </div>
            <small style={{ color: 'var(--color-muted)' }}>
              {activeSession.status === 'active'
                ? t('verifiedUtc', { ns: 'portal' })
                : activeSession.status === 'paused'
                ? t('pausedByOperator', { ns: 'portal' })
                : t('sessionExpired', { ns: 'portal' })}
            </small>
          </div>

          {/* Session Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ color: 'var(--color-muted)' }}>{t('deviceMac', { ns: 'portal' })}</span>
              <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {activeSession.deviceMac || t('autoDetected', { ns: 'portal' })}
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--color-muted)' }}>{t('expiresAt', { ns: 'portal' })}</span>
              <div style={{ fontWeight: 600 }}>
                {activeSession.expiresAt ? formatTime(activeSession.expiresAt, currentLang) : 'N/A'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-outline"
              style={{ flex: 1 }}
              onClick={() => pollSession(activeSession.id)}
              disabled={polling}
            >
              {polling ? t('checking', { ns: 'portal' }) : t('refreshStatus', { ns: 'portal' })}
            </button>
            <button
              type="button"
              className="btn-outline"
              style={{ flex: 1, color: 'var(--color-danger)' }}
              onClick={handleDisconnectLocal}
            >
              {t('signOut', { ns: 'common' })}
            </button>
          </div>
        </div>
      ) : (
        /* VOUCHER REDEMPTION CARD */
        <div
          style={{
            background: 'white',
            borderRadius: 'var(--radius-card)',
            padding: '1.75rem',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
            marginBottom: '1.5rem',
          }}
        >
          <h3 style={{ margin: '0 0 0.5rem 0' }}>{t('redeemTitle', { ns: 'portal' })}</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {t('redeemSubtitle', { ns: 'portal' })}
          </p>

          <form onSubmit={handleRedeemVoucher}>
            <div className="form-group">
              <label className="form-label">{t('voucherCode', { ns: 'portal' })}</label>
              <input
                type="text"
                placeholder={t('voucherPlaceholder', { ns: 'portal' })}
                className="form-input"
                style={{ fontSize: '1.1rem', letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'center', fontWeight: 700 }}
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('clientMac', { ns: 'portal' })}</label>
              <input
                type="text"
                className="form-input"
                value={deviceMac}
                onChange={(e) => setDeviceMac(e.target.value)}
                placeholder="AA:BB:CC:DD:EE:FF"
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', marginTop: '0.5rem' }}
              disabled={isRedeeming}
            >
              {isRedeeming ? t('validatingBtn', { ns: 'portal' }) : t('connectBtn', { ns: 'portal' })}
            </button>
          </form>
        </div>
      )}

      {/* Connection Help & Guide */}
      <div
        style={{
          background: 'white',
          borderRadius: 'var(--radius-card)',
          padding: '1.5rem',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <h4 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>ℹ️</span> {t('helpTitle', { ns: 'portal' })}
        </h4>
        <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--color-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem', lineHeight: 1.5 }}>
          <li>
            <strong>{t('step1Title', { ns: 'portal' })}</strong> {t('step1Desc', { ns: 'portal' })}
          </li>
          <li>
            <strong>{t('step2Title', { ns: 'portal' })}</strong> {t('step2Desc', { ns: 'portal' })}
          </li>
          <li>
            <strong>{t('step3Title', { ns: 'portal' })}</strong> {t('step3Desc', { ns: 'portal' })}
          </li>
          <li>
            <strong>{t('step4Title', { ns: 'portal' })}</strong> {t('step4Desc', { ns: 'portal' })}
          </li>
        </ol>
      </div>
    </div>
  );
}
