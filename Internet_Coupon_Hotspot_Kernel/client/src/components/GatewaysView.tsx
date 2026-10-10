import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate, formatTime } from '../i18n/index.js';
import type { SupportedLocale } from '../i18n/types.js';

const API = import.meta.env.VITE_API_BASE_URL ?? '';

interface GatewayItem {
  id: string;
  name: string;
  mode: 'limited_owner_mode' | 'managed_gateway_mode';
  adapterType: string;
  status: string;
  host?: string | null;
  port?: number | null;
  lastSeenAt?: string | null;
}

interface GatewayCapabilities {
  mode: string;
  canAuthorizeAccess: boolean;
  canDisconnectClient: boolean;
  canLimitBandwidth: boolean;
  canMeasureTraffic: boolean;
  requiresHardwareGateway: boolean;
  disclosureStatement: string;
}

interface GatewaysViewProps {
  token: string;
  onFeedback: (message: string, type: 'success' | 'error') => void;
}

export function GatewaysView({ token, onFeedback }: GatewaysViewProps) {
  const { t, i18n } = useTranslation(['gateways', 'common', 'validation']);
  const currentLang = (i18n.language as SupportedLocale) || 'en';

  const [gateways, setGateways] = useState<GatewayItem[]>([]);
  const [_activeAdapter, setActiveAdapter] = useState<string>('limited_owner');
  const [_capabilities, setCapabilities] = useState<GatewayCapabilities | null>(null);
  const [loading, setLoading] = useState(false);

  // Register Gateway Form
  const [newGwName, setNewGwName] = useState('RouterOS Main Gateway');
  const [newGwMode, setNewGwMode] = useState<'limited_owner_mode' | 'managed_gateway_mode'>('managed_gateway_mode');
  const [newGwAdapter, setNewGwAdapter] = useState('mock_test_gateway');
  const [registering, setRegistering] = useState(false);

  // Diagnostics Panel
  const [selectedGwId, setSelectedGwId] = useState<string>('');
  const [diagMac, setDiagMac] = useState('11:22:33:44:55:66');
  const [diagResult, setDiagResult] = useState<any>(null);
  const [diagLoading, setDiagLoading] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const loadGateways = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/gateways`, { headers });
      if (res.ok) {
        const data = await res.json();
        setGateways(data.gateways || []);
        setActiveAdapter(data.activeAdapter || 'limited_owner');
        setCapabilities(data.capabilities || null);
        if (data.gateways?.length > 0 && !selectedGwId) {
          setSelectedGwId(data.gateways[0].id);
        }
      }
    } catch {
      onFeedback(t('NETWORK_ERROR', { ns: 'validation' }), 'error');
    } finally {
      setLoading(false);
    }
  }, [token, selectedGwId, t]);

  useEffect(() => {
    loadGateways();
  }, [loadGateways]);

  const handleRegisterGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    try {
      const res = await fetch(`${API}/api/v1/gateways`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newGwName,
          mode: newGwMode,
          adapterType: newGwAdapter,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onFeedback(`Gateway registered: ${data.gateway.name}`, 'success');
        setNewGwName('Secondary Managed AP');
        loadGateways();
      } else {
        onFeedback(data.error?.message || t('SERVER_ERROR', { ns: 'validation' }), 'error');
      }
    } catch {
      onFeedback(t('NETWORK_ERROR', { ns: 'validation' }), 'error');
    } finally {
      setRegistering(false);
    }
  };

  const handleCheckHealth = async () => {
    if (!selectedGwId) {
      onFeedback('Please select a gateway first', 'error');
      return;
    }
    setDiagLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/gateways/${selectedGwId}/health`, { headers });
      const data = await res.json();
      if (res.ok) {
        setDiagResult({ type: 'HEALTH_CHECK', data: data.health });
        onFeedback('Health check probe received', 'success');
      } else {
        onFeedback(data.error?.message || 'Health probe failed', 'error');
      }
    } catch {
      onFeedback(t('NETWORK_ERROR', { ns: 'validation' }), 'error');
    } finally {
      setDiagLoading(false);
    }
  };

  const handleQueryAccounting = async () => {
    if (!selectedGwId) {
      onFeedback('Please select a gateway first', 'error');
      return;
    }
    setDiagLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/gateways/${selectedGwId}/accounting/${encodeURIComponent(diagMac)}`, { headers });
      const data = await res.json();
      if (res.ok) {
        setDiagResult({ type: 'ACCOUNTING_QUERY', data: data.accounting });
        onFeedback('Client traffic accounting retrieved', 'success');
      } else {
        onFeedback(data.error?.message || 'Accounting query failed', 'error');
      }
    } catch {
      onFeedback(t('NETWORK_ERROR', { ns: 'validation' }), 'error');
    } finally {
      setDiagLoading(false);
    }
  };

  const handleTestDisconnect = async () => {
    if (!selectedGwId) {
      onFeedback('Please select a gateway first', 'error');
      return;
    }
    setDiagLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/gateways/${selectedGwId}/disconnect`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          clientMac: diagMac,
          reason: 'Manual operator test kick',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDiagResult({ type: 'DISCONNECT_COMMAND', data: data.result });
        onFeedback(`Disconnect command sent to client [${diagMac}]`, 'success');
      } else {
        onFeedback(data.error?.message || 'Disconnect command failed', 'error');
      }
    } catch {
      onFeedback(t('NETWORK_ERROR', { ns: 'validation' }), 'error');
    } finally {
      setDiagLoading(false);
    }
  };

  return (
    <div>
      <div className="heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <small style={{ color: 'var(--color-brand-secondary)', letterSpacing: '0.08em', fontWeight: 800 }}>
            {t('title', { ns: 'gateways' }).toUpperCase()}
          </small>
          <h2 style={{ margin: '0.25rem 0 0', fontSize: '1.35rem' }}>{t('title', { ns: 'gateways' })}</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-muted)', fontSize: '0.85rem' }}>
            {t('subtitle', { ns: 'gateways' })}
          </p>
        </div>
        <button type="button" className="btn-outline" onClick={loadGateways} disabled={loading}>
          {loading ? t('loading', { ns: 'common' }) : `🔄 ${t('refresh', { ns: 'common' })}`}
        </button>
      </div>

      {/* Prominent Architectural Disclosures */}
      <div className="grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <article className="card" style={{ borderLeft: '4px solid #f59e0b', padding: '1rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: '1.5rem' }}>📱</span>
          <div>
            <h3 style={{ margin: '0.25rem 0', fontSize: '1.1rem' }}>{t('limitedOwnerMode', { ns: 'gateways' })}</h3>
            <p style={{ margin: '0.4rem 0', fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--color-text)' }}>
              {t('disclosureNote', { ns: 'gateways' })}
            </p>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-inactive">Disconnect: Unsupported</span>
              <span className="badge badge-inactive">Bandwidth: Unmanaged</span>
            </div>
          </div>
        </article>

        <article className="card" style={{ borderLeft: '4px solid var(--color-brand-secondary)', padding: '1rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: '1.5rem' }}>🌐</span>
          <div>
            <h3 style={{ margin: '0.25rem 0', fontSize: '1.1rem' }}>{t('managedGatewayMode', { ns: 'gateways' })}</h3>
            <p style={{ margin: '0.4rem 0', fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--color-text)' }}>
              Compatible with MikroTik RouterOS, OpenWrt, CoovaChilli, or managed RADIUS/REST controllers.
            </p>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-active">{t('canAuthorize', { ns: 'gateways' })}</span>
              <span className="badge badge-active">{t('canDisconnect', { ns: 'gateways' })}</span>
              <span className="badge badge-active">{t('canLimitBandwidth', { ns: 'gateways' })}</span>
            </div>
          </div>
        </article>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Register Gateway Form */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>{t('registerModalTitle', { ns: 'gateways' })}</h3>
          <form onSubmit={handleRegisterGateway}>
            <div className="form-group">
              <label className="form-label">{t('gatewayName', { ns: 'gateways' })}</label>
              <input
                type="text"
                className="form-input"
                placeholder="Front-Desk MikroTik hAP"
                value={newGwName}
                onChange={(e) => setNewGwName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mode</label>
              <select
                className="form-input"
                value={newGwMode}
                onChange={(e) => {
                  const m = e.target.value as any;
                  setNewGwMode(m);
                  setNewGwAdapter(m === 'limited_owner_mode' ? 'limited_owner' : 'mock_test_gateway');
                }}
              >
                <option value="managed_gateway_mode">{t('managedGatewayMode', { ns: 'gateways' })}</option>
                <option value="limited_owner_mode">{t('limitedOwnerMode', { ns: 'gateways' })}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Adapter</label>
              <select
                className="form-input"
                value={newGwAdapter}
                onChange={(e) => setNewGwAdapter(e.target.value)}
              >
                <option value="mock_test_gateway">{t('mockGateway', { ns: 'gateways' })}</option>
                <option value="limited_owner">Limited Owner Android Adapter</option>
              </select>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={registering}>
              {registering ? t('loading', { ns: 'common' }) : `+ ${t('submitGateway', { ns: 'gateways' })}`}
            </button>
          </form>
        </div>

        {/* Diagnostics & Command Test Harness */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>{t('diagnostics', { ns: 'gateways' })}</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '1rem' }}>
            Dispatch test commands to verify adapter communication and client telemetry.
          </p>

          <div className="form-group">
            <label className="form-label">Target Gateway</label>
            <select
              className="form-input"
              value={selectedGwId}
              onChange={(e) => setSelectedGwId(e.target.value)}
            >
              {gateways.length === 0 ? (
                <option value="">{t('noGateways', { ns: 'gateways' })}</option>
              ) : (
                gateways.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} [{g.adapterType}] ({g.status})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t('testMac', { ns: 'gateways' })}</label>
            <input
              type="text"
              className="form-input"
              value={diagMac}
              onChange={(e) => setDiagMac(e.target.value)}
              placeholder="11:22:33:44:55:66"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn-outline"
              onClick={handleCheckHealth}
              disabled={diagLoading}
              style={{ fontSize: '0.8rem' }}
            >
              🩺 {t('runProbe', { ns: 'gateways' })}
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={handleQueryAccounting}
              disabled={diagLoading}
              style={{ fontSize: '0.8rem' }}
            >
              📊 Query Bytes
            </button>
            <button
              type="button"
              className="btn-outline"
              style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}
              onClick={handleTestDisconnect}
              disabled={diagLoading}
            >
              ⚡ Disconnect MAC
            </button>
          </div>

          {diagResult && (
            <div style={{ marginTop: '1rem', background: '#0f172a', color: '#38bdf8', padding: '0.85rem', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.78rem', overflowX: 'auto' }}>
              <div style={{ color: '#94a3b8', marginBottom: '0.35rem' }}>// {t('probeResult', { ns: 'gateways' })}: {diagResult.type}</div>
              <pre style={{ margin: 0 }}>{JSON.stringify(diagResult.data, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Registered Gateways Table */}
      <div style={{ marginTop: '1.5rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t('gatewayName', { ns: 'gateways' })}</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Mode</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Adapter</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t('status', { ns: 'common' })}</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t('lastSeen', { ns: 'gateways' })}</th>
            </tr>
          </thead>
          <tbody>
            {gateways.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-muted)' }}>
                  {t('noGateways', { ns: 'gateways' })}
                </td>
              </tr>
            ) : (
              gateways.map((g) => (
                <tr key={g.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{g.name}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className="badge badge-inactive">
                      {g.mode === 'managed_gateway_mode' ? 'Managed Router' : 'Android Hotspot'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>{g.adapterType}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className={`badge ${g.status === 'online' ? 'badge-active' : 'badge-inactive'}`}>
                      {t(g.status, { ns: 'common', defaultValue: g.status })}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-muted)', fontSize: '0.78rem' }}>
                    {g.lastSeenAt ? `${formatDate(g.lastSeenAt, currentLang)} ${formatTime(g.lastSeenAt, currentLang)}` : 'Never'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
