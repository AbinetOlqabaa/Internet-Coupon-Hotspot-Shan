import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatNumber } from '../i18n/index.js';
import type { SupportedLocale } from '../i18n/types.js';

const API = import.meta.env.VITE_API_BASE_URL ?? '';

interface AnalyticsOverview {
  revenue: {
    totalRevenueMinor: number;
    totalRefundsMinor: number;
    netBalanceMinor: number;
    currency: string;
  };
  sessions: {
    total: number;
    active: number;
    expired: number;
    paused: number;
    revoked: number;
  };
  customers: {
    total: number;
    withConsent: number;
  };
  gateways: {
    total: number;
    online: number;
    offline: number;
    unmanaged: number;
  };
  dataFreshness: {
    timestamp: string;
    sourceLabels: string[];
  };
}

interface RevenueData {
  timeSeries: Array<{
    date: string;
    grossMinor: number;
    refundsMinor: number;
    netMinor: number;
    count: number;
  }>;
  providerBreakdown: Record<string, { totalMinor: number; count: number }>;
  dataFreshness: string;
  sourceLabels: string[];
}

interface UsageData {
  totalDeliveredHours: number;
  packageBreakdown: Array<{
    packageId: string;
    packageName: string;
    sessionCount: number;
    totalDurationSeconds: number;
  }>;
  sourceLabels: string[];
}

interface RetentionData {
  totalCustomers: number;
  returningCustomers: number;
  singleVisitCustomers: number;
  retentionRatePercentage: number;
  sourceLabels: string[];
}

interface AnalyticsViewProps {
  token: string;
  onFeedback: (msg: string, type: 'ok' | 'err') => void;
}

export function AnalyticsView({ token, onFeedback }: AnalyticsViewProps) {
  const { t, i18n } = useTranslation(['analytics', 'common']);
  const currentLang = (i18n.language as SupportedLocale) || 'en';

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [retention, setRetention] = useState<RetentionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [ovRes, revRes, usgRes, retRes] = await Promise.all([
        fetch(`${API}/api/v1/analytics/overview`, { headers }),
        fetch(`${API}/api/v1/analytics/revenue`, { headers }),
        fetch(`${API}/api/v1/analytics/usage`, { headers }),
        fetch(`${API}/api/v1/analytics/retention`, { headers }),
      ]);

      if (ovRes.ok) setOverview(await ovRes.json());
      if (revRes.ok) setRevenue(await revRes.json());
      if (usgRes.ok) setUsage(await usgRes.json());
      if (retRes.ok) setRetention(await retRes.json());
    } catch {
      onFeedback('Failed to load telemetry analytics.', 'err');
    } finally {
      setLoading(false);
    }
  }, [token, onFeedback]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExport = async (type: 'ledger' | 'sessions') => {
    setDownloading(type);
    try {
      const res = await fetch(`${API}/api/v1/analytics/export?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hotspot-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      onFeedback(`Exported ${type} CSV successfully.`, 'ok');
    } catch {
      onFeedback(`Failed to export ${type} CSV.`, 'err');
    } finally {
      setDownloading(null);
    }
  };

  const formatMoney = (minor: number, curr = 'USD') => {
    return formatCurrency(minor, curr, currentLang);
  };

  if (loading && !overview) {
    return (
      <div className="tab-pane active" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>{t('loading', { ns: 'common' })}</p>
      </div>
    );
  }

  return (
    <div className="tab-pane active">
      <div className="heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <small style={{ color: 'var(--color-brand-secondary)', letterSpacing: '0.08em', fontWeight: 800 }}>
            {t('title', { ns: 'analytics' }).toUpperCase()}
          </small>
          <h2 style={{ margin: '0.25rem 0 0', fontSize: '1.35rem' }}>{t('title', { ns: 'analytics' })}</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-muted)', fontSize: '0.85rem' }}>
            {t('subtitle', { ns: 'analytics' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-outline"
            onClick={() => handleExport('ledger')}
            disabled={downloading !== null}
          >
            {downloading === 'ledger' ? t('downloading', { ns: 'analytics' }) : `📥 ${t('exportLedger', { ns: 'analytics' })}`}
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={() => handleExport('sessions')}
            disabled={downloading !== null}
          >
            {downloading === 'sessions' ? t('downloading', { ns: 'analytics' }) : `📥 ${t('exportSessions', { ns: 'analytics' })}`}
          </button>
          <button type="button" className="btn-outline" onClick={fetchAnalytics}>
            🔄 {t('refresh', { ns: 'common' })}
          </button>
        </div>
      </div>

      {overview && (
        <div className="grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <article className="card" style={{ padding: '1.25rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '1.5rem' }}>💰</span>
            <div style={{ marginTop: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{formatMoney(overview.revenue.netBalanceMinor, overview.revenue.currency)}</h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                {t('netBalance', { ns: 'analytics' })} ({t('totalGross', { ns: 'analytics' })}: {formatMoney(overview.revenue.totalRevenueMinor, overview.revenue.currency)})
              </p>
            </div>
          </article>

          <article className="card" style={{ padding: '1.25rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '1.5rem' }}>⏱️</span>
            <div style={{ marginTop: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{usage ? `${formatNumber(usage.totalDeliveredHours, currentLang)} hrs` : '...'}</h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                {t('deliveredHours', { ns: 'analytics' })} · {overview.sessions.active} {t('active', { ns: 'common' })}
              </p>
            </div>
          </article>

          <article className="card" style={{ padding: '1.25rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '1.5rem' }}>👥</span>
            <div style={{ marginTop: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{retention ? `${retention.retentionRatePercentage}%` : '...'}</h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                {t('retentionRate', { ns: 'analytics' })} ({retention?.returningCustomers ?? 0} {t('returningCustomers', { ns: 'analytics' })})
              </p>
            </div>
          </article>

          <article className="card" style={{ padding: '1.25rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '1.5rem' }}>🌐</span>
            <div style={{ marginTop: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{overview.gateways.online} / {overview.gateways.total}</h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                Gateways {t('online', { ns: 'common' })}
              </p>
            </div>
          </article>
        </div>
      )}

      {/* Revenue Breakdown */}
      <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>{t('revenueTrends', { ns: 'analytics' })}</h3>
            <small style={{ color: 'var(--color-muted)' }}>Double-Entry Journal History</small>
          </div>
        </div>

        {revenue && revenue.timeSeries.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '0.65rem 0.85rem' }}>{t('date', { ns: 'common' })}</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Transactions</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>{t('totalGross', { ns: 'analytics' })}</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>{t('totalRefunds', { ns: 'analytics' })}</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>{t('netBalance', { ns: 'analytics' })}</th>
                </tr>
              </thead>
              <tbody>
                {revenue.timeSeries.map((row) => (
                  <tr key={row.date} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.65rem 0.85rem', fontFamily: 'monospace' }}>{row.date}</td>
                    <td style={{ padding: '0.65rem 0.85rem' }}>{row.count}</td>
                    <td style={{ padding: '0.65rem 0.85rem', color: 'var(--color-success)' }}>{formatMoney(row.grossMinor)}</td>
                    <td style={{ padding: '0.65rem 0.85rem', color: row.refundsMinor > 0 ? 'var(--color-danger)' : 'inherit' }}>
                      {formatMoney(row.refundsMinor)}
                    </td>
                    <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>
                      {formatMoney(row.netMinor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--color-muted)', margin: 0 }}>{t('noData', { ns: 'analytics' })}</p>
        )}
      </div>

      {/* Package Usage & Retention */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.25rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>{t('packageBreakdown', { ns: 'analytics' })}</h3>
          {usage && usage.packageBreakdown.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {usage.packageBreakdown.map((pkg) => (
                <div key={pkg.packageId}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600 }}>{pkg.packageName}</span>
                    <span style={{ color: 'var(--color-muted)' }}>
                      {pkg.sessionCount} sessions · {Math.round((pkg.totalDurationSeconds / 3600) * 10) / 10}h
                    </span>
                  </div>
                  <div style={{ background: 'var(--color-bg)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        background: 'var(--color-brand-secondary)',
                        height: '100%',
                        width: `${Math.min(100, Math.max(5, (pkg.sessionCount / (overview?.sessions.total || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--color-muted)', margin: 0 }}>{t('noData', { ns: 'analytics' })}</p>
          )}
        </div>

        <div style={{ padding: '1.25rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>{t('retentionRate', { ns: 'analytics' })}</h3>
          {retention ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                <span>Total Customers Tracked</span>
                <strong>{retention.totalCustomers}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                <span>{t('returningCustomers', { ns: 'analytics' })}</span>
                <strong style={{ color: 'var(--color-success)' }}>{retention.returningCustomers}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('retentionRate', { ns: 'analytics' })}</span>
                <strong style={{ color: 'var(--color-brand-secondary)', fontSize: '1.1rem' }}>{retention.retentionRatePercentage}%</strong>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--color-muted)', margin: 0 }}>{t('noData', { ns: 'analytics' })}</p>
          )}
        </div>
      </div>
    </div>
  );
}
