import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../i18n/index.js';
import type { SupportedLocale } from '../i18n/types.js';

const API = import.meta.env.VITE_API_BASE_URL ?? '';

interface SegmentsData {
  summary: {
    VIP: { count: number; customerIds: string[] };
    REGULAR: { count: number; customerIds: string[] };
    AT_RISK: { count: number; customerIds: string[] };
    NEW: { count: number; customerIds: string[] };
  };
  totalCustomers: number;
  rules: Record<string, string>;
}

interface CustomerProfile {
  customerId: string;
  displayName?: string | null;
  segment: 'VIP' | 'REGULAR' | 'AT_RISK' | 'NEW';
  segmentExplanation: {
    criteria: string;
    evidence: Record<string, unknown>;
  };
  badges: Array<{
    id: string;
    badgeCode: string;
    name: string;
    criteriaEvidence: Record<string, unknown>;
    awardedAt: string;
  }>;
  bonuses: Array<{
    id: string;
    bonusType: string;
    amountUnits: number;
    budgetDeductionMinor: number;
    status: string;
    expiresAt: string;
    auditReason: string;
  }>;
  lifetimeSpendMinor: number;
  totalSessions: number;
}

interface LoyaltyViewProps {
  token: string;
  onFeedback: (msg: string, type: 'ok' | 'err') => void;
}

export function LoyaltyView({ token, onFeedback }: LoyaltyViewProps) {
  const { t, i18n } = useTranslation(['loyalty', 'common', 'validation']);
  const currentLang = (i18n.language as SupportedLocale) || 'en';

  const [segments, setSegments] = useState<SegmentsData | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states for granting bonuses
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusType, setBonusType] = useState<'free_minutes' | 'discount_voucher'>('free_minutes');
  const [bonusAmount, setBonusAmount] = useState(30);
  const [budgetDeduction, setBudgetDeduction] = useState(100);
  const [bonusReason, setBonusReason] = useState('Customer Loyalty Reward');
  const [granting, setGranting] = useState(false);

  const fetchSegments = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/v1/loyalty/segments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSegments(await res.json());
      }
    } catch {
      onFeedback('Failed to load loyalty segments.', 'err');
    }
  }, [token, onFeedback]);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  const loadCustomer = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/loyalty/profile/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCustomerProfile(await res.json());
      } else {
        onFeedback('Customer loyalty profile not found.', 'err');
        setCustomerProfile(null);
      }
    } catch {
      onFeedback('Failed to inspect profile.', 'err');
    } finally {
      setLoading(false);
    }
  };

  const handleAwardBadge = async (code: 'EARLY_ADOPTER' | 'LOYAL_STREAMER' | 'WEEKEND_WARRIOR' | 'COMMUNITY_REGULAR') => {
    if (!selectedCustomerId) return;
    try {
      const res = await fetch(`${API}/api/v1/loyalty/badges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          badgeCode: code,
          evidence: { manualGrantBy: 'owner', timestamp: new Date().toISOString() },
        }),
      });
      if (!res.ok) throw new Error('Badge award failed');
      onFeedback(`Badge awarded successfully!`, 'ok');
      loadCustomer(selectedCustomerId);
    } catch {
      onFeedback('Failed to award badge.', 'err');
    }
  };

  const handleGrantBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    setGranting(true);
    try {
      const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
      const res = await fetch(`${API}/api/v1/loyalty/bonuses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          bonusType,
          amountUnits: Number(bonusAmount),
          budgetDeductionMinor: Number(budgetDeduction),
          expiresAt,
          auditReason: bonusReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Bonus grant failed');
      onFeedback(t('bonusSuccess', { ns: 'loyalty' }), 'ok');
      setShowBonusModal(false);
      loadCustomer(selectedCustomerId);
    } catch (err: unknown) {
      onFeedback((err as Error).message, 'err');
    } finally {
      setGranting(false);
    }
  };

  return (
    <div className="tab-pane active">
      <div className="heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <small style={{ color: 'var(--color-brand-secondary)', letterSpacing: '0.08em', fontWeight: 800 }}>
            {t('title', { ns: 'loyalty' }).toUpperCase()}
          </small>
          <h2 style={{ margin: '0.25rem 0 0', fontSize: '1.35rem' }}>{t('title', { ns: 'loyalty' })}</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-muted)', fontSize: '0.85rem' }}>
            {t('subtitle', { ns: 'loyalty' })}
          </p>
        </div>
        <button type="button" className="btn-outline" onClick={fetchSegments}>
          🔄 {t('refresh', { ns: 'common' })}
        </button>
      </div>

      {segments && (
        <div className="grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <article className="card" style={{ padding: '1rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '1.5rem' }}>⭐</span>
            <div>
              <h3 style={{ margin: '0.25rem 0' }}>{t('vip', { ns: 'loyalty' })} ({segments.summary.VIP.count})</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-muted)' }}>{segments.rules.VIP}</p>
            </div>
          </article>

          <article className="card" style={{ padding: '1rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '1.5rem' }}>🌱</span>
            <div>
              <h3 style={{ margin: '0.25rem 0' }}>{t('newCustomers', { ns: 'loyalty' })} ({segments.summary.NEW.count})</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-muted)' }}>{segments.rules.NEW}</p>
            </div>
          </article>

          <article className="card" style={{ padding: '1rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '1.5rem' }}>👥</span>
            <div>
              <h3 style={{ margin: '0.25rem 0' }}>{t('regular', { ns: 'loyalty' })} ({segments.summary.REGULAR.count})</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-muted)' }}>{segments.rules.REGULAR}</p>
            </div>
          </article>

          <article className="card" style={{ padding: '1rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div>
              <h3 style={{ margin: '0.25rem 0' }}>{t('atRisk', { ns: 'loyalty' })} ({segments.summary.AT_RISK.count})</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-muted)' }}>{segments.rules.AT_RISK}</p>
            </div>
          </article>
        </div>
      )}

      {/* Customer Lookup & Profile Card */}
      <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
        <h3 style={{ marginTop: 0 }}>{t('customerDetails', { ns: 'loyalty' })}</h3>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>
          {t('selectCustomer', { ns: 'loyalty' })}
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '600px', marginBottom: '1.25rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Paste customer ID..."
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value.trim())}
          />
          <button type="button" className="btn-primary" onClick={() => loadCustomer(selectedCustomerId)} disabled={loading}>
            {loading ? t('loading', { ns: 'common' }) : t('view', { ns: 'common' })}
          </button>
        </div>

        {customerProfile && (
          <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0' }}>
                  {customerProfile.displayName || 'Customer'} (
                  <span style={{ color: '#3b82f6' }}>{customerProfile.segment}</span>)
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                  ID: <code>{customerProfile.customerId}</code>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn-primary" onClick={() => setShowBonusModal(true)}>
                  🎁 {t('grantBonus', { ns: 'loyalty' })}
                </button>
              </div>
            </div>

            {/* Explanation Evidence Card */}
            <div style={{ background: '#dbeafe', border: '1px solid #bfdbfe', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', color: '#1e40af', fontSize: '0.85rem' }}>
              <strong>Segment Criteria:</strong> {customerProfile.segmentExplanation.criteria}
            </div>

            {/* Badges */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h5 style={{ margin: 0 }}>{t('badgesAwarded', { ns: 'loyalty' })} ({customerProfile.badges.length})</h5>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button type="button" className="btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={() => handleAwardBadge('COMMUNITY_REGULAR')}>
                    + Community Regular
                  </button>
                  <button type="button" className="btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={() => handleAwardBadge('LOYAL_STREAMER')}>
                    + Loyal Streamer
                  </button>
                </div>
              </div>
              {customerProfile.badges.length > 0 ? (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {customerProfile.badges.map((b) => (
                    <span key={b.id} style={{ background: '#f1f5f9', padding: '0.25rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                      🏅 {b.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-muted)' }}>No badges awarded yet.</p>
              )}
            </div>

            {/* Active Bonuses */}
            <div>
              <h5 style={{ margin: '0 0 0.5rem 0' }}>Granted Bonuses ({customerProfile.bonuses.length})</h5>
              {customerProfile.bonuses.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                        <th style={{ padding: '0.5rem' }}>{t('bonusType', { ns: 'loyalty' })}</th>
                        <th style={{ padding: '0.5rem' }}>Benefit</th>
                        <th style={{ padding: '0.5rem' }}>{t('budgetDeduction', { ns: 'loyalty' })}</th>
                        <th style={{ padding: '0.5rem' }}>{t('status', { ns: 'common' })}</th>
                        <th style={{ padding: '0.5rem' }}>{t('expires', { ns: 'coupons' })}</th>
                        <th style={{ padding: '0.5rem' }}>{t('reason', { ns: 'loyalty' })}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerProfile.bonuses.map((b) => (
                        <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '0.5rem' }}>{b.bonusType}</td>
                          <td style={{ padding: '0.5rem' }}>{b.bonusType === 'free_minutes' ? `${b.amountUnits} Mins` : `${b.amountUnits}% Off`}</td>
                          <td style={{ padding: '0.5rem' }}>{b.budgetDeductionMinor}</td>
                          <td style={{ padding: '0.5rem' }}>
                            <span className="badge badge-active">{b.status}</span>
                          </td>
                          <td style={{ padding: '0.5rem' }}>{formatDate(b.expiresAt, currentLang)}</td>
                          <td style={{ padding: '0.5rem' }}>{b.auditReason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-muted)' }}>No bonuses granted.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grant Bonus Modal */}
      {showBonusModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>{t('grantBonus', { ns: 'loyalty' })}</h3>
            <form onSubmit={handleGrantBonus}>
              <div className="form-group">
                <label className="form-label">{t('bonusType', { ns: 'loyalty' })}</label>
                <select className="form-input" value={bonusType} onChange={(e) => setBonusType(e.target.value as any)}>
                  <option value="free_minutes">{t('freeMinutes', { ns: 'loyalty' })}</option>
                  <option value="discount_voucher">{t('discountVoucher', { ns: 'loyalty' })}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('amountUnits', { ns: 'loyalty' })}</label>
                <input
                  type="number"
                  className="form-input"
                  min="5"
                  max="300"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('budgetDeduction', { ns: 'loyalty' })}</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={budgetDeduction}
                  onChange={(e) => setBudgetDeduction(Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('reason', { ns: 'loyalty' })}</label>
                <input
                  type="text"
                  className="form-input"
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setShowBonusModal(false)}>
                  {t('cancel', { ns: 'common' })}
                </button>
                <button type="submit" className="btn-primary" disabled={granting}>
                  {granting ? t('granting', { ns: 'loyalty' }) : t('grantBtn', { ns: 'loyalty' })}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
