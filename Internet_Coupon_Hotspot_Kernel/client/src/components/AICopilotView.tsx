import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatTime } from '../i18n/index.js';
import type { SupportedLocale } from '../i18n/types.js';

const API = import.meta.env.VITE_API_BASE_URL ?? '';

interface AIProvider {
  id: string;
  provider: 'gemini' | 'groq' | 'ollama' | 'openai_compatible';
  model: string;
  type: 'hosted' | 'local';
  endpoint?: string | null;
  maskedKey: string;
  capabilities: string[];
  isFreeTier: boolean;
  priority: number;
  enabled: boolean;
  health: 'healthy' | 'degraded' | 'rate_limited' | 'unreachable';
  quotaEvidence?: {
    remainingRequests?: number;
    resetAt?: string;
    source: string;
  };
}

interface ForecastData {
  forecastPeriod: string;
  projectedRevenueMinor: number;
  projectedSessions: number;
  uncertaintyBandPercent: number;
  minimumDataWarning?: string | null;
  dataFreshness: string;
  disclaimer: string;
}

interface Anomaly {
  id: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  recommendation: string;
  detectedAt: string;
}

interface AICopilotViewProps {
  token: string;
  currency?: string;
  onFeedback: (msg: string, type: 'ok' | 'err') => void;
}

export function AICopilotView({ token, currency = 'USD', onFeedback }: AICopilotViewProps) {
  const { t, i18n } = useTranslation(['ai', 'common', 'validation']);
  const currentLang = (i18n.language as SupportedLocale) || 'en';

  const [activeSubTab, setActiveSubTab] = useState<'copilot' | 'providers' | 'forecast' | 'anomalies' | 'support'>('copilot');
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  // Copilot Chat
  const [copilotQuestion, setCopilotQuestion] = useState('');
  const [copilotAnswer, setCopilotAnswer] = useState<{
    query: string;
    response: string;
    providerUsed: string;
    freeTierRouting: boolean;
    citedSources: string[];
    safetyPolicy: { requiresOwnerConfirmation: boolean; automatedActionPermitted: boolean; note: string };
  } | null>(null);
  const [asking, setAsking] = useState(false);

  // Support Drafter
  const [customerIssue, setCustomerIssue] = useState('');
  const [supportDraft, setSupportDraft] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);

  // New Provider Form
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [newProvider, setNewProvider] = useState<'gemini' | 'groq' | 'ollama' | 'openai_compatible'>('gemini');
  const [newModel, setNewModel] = useState('gemini-1.5-flash');
  const [newKey, setNewKey] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [priority, setPriority] = useState(1);
  const [savingProvider, setSavingProvider] = useState(false);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/v1/ai/providers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setProviders(d.providers);
      }
    } catch {
      // ignore
    }
  }, [token]);

  const fetchForecast = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/v1/ai/forecast`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setForecast(await res.json());
    } catch {
      // ignore
    }
  }, [token]);

  const fetchAnomalies = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/v1/ai/anomalies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setAnomalies(d.anomalies);
      }
    } catch {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    fetchProviders();
    fetchForecast();
    fetchAnomalies();
  }, [fetchProviders, fetchForecast, fetchAnomalies]);

  const handleAskCopilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotQuestion.trim()) return;
    setAsking(true);
    try {
      const res = await fetch(`${API}/api/v1/ai/copilot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: copilotQuestion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Copilot query failed');
      setCopilotAnswer(data);
    } catch (err: unknown) {
      onFeedback((err as Error).message, 'err');
    } finally {
      setAsking(false);
    }
  };

  const handleDraftSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerIssue.trim()) return;
    setDrafting(true);
    try {
      const res = await fetch(`${API}/api/v1/ai/support-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ customerIssue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Support draft failed');
      setSupportDraft(data.draftResponse);
      onFeedback('Privacy-safe response draft generated.', 'ok');
    } catch (err: unknown) {
      onFeedback((err as Error).message, 'err');
    } finally {
      setDrafting(false);
    }
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProvider(true);
    try {
      const res = await fetch(`${API}/api/v1/ai/providers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider: newProvider,
          model: newModel,
          apiKey: newKey || undefined,
          isFreeTier: isFree,
          priority: Number(priority),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Registration failed');
      onFeedback('AI Provider registered with masked key.', 'ok');
      setShowAddProvider(false);
      setNewKey('');
      fetchProviders();
    } catch (err: unknown) {
      onFeedback((err as Error).message, 'err');
    } finally {
      setSavingProvider(false);
    }
  };

  const handleTestProvider = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/v1/ai/providers/${id}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Test failed');
      onFeedback(`Health check OK (${data.latencyMs}ms). Quota source: ${data.quotaEvidence.source}`, 'ok');
      fetchProviders();
    } catch (err: unknown) {
      onFeedback((err as Error).message, 'err');
    }
  };

  return (
    <div className="tab-pane active">
      <div className="heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <small style={{ color: 'var(--color-brand-secondary)', letterSpacing: '0.08em', fontWeight: 800 }}>
            {t('title', { ns: 'ai' }).toUpperCase()}
          </small>
          <h2 style={{ margin: '0.25rem 0 0', fontSize: '1.35rem' }}>{t('title', { ns: 'ai' })}</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-muted)', fontSize: '0.85rem' }}>
            {t('subtitle', { ns: 'ai' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={activeSubTab === 'copilot' ? 'btn-primary' : 'btn-outline'}
            onClick={() => setActiveSubTab('copilot')}
          >
            💬 {t('copilotTab', { ns: 'ai' })}
          </button>
          <button
            type="button"
            className={activeSubTab === 'forecast' ? 'btn-primary' : 'btn-outline'}
            onClick={() => setActiveSubTab('forecast')}
          >
            📈 {t('forecastTab', { ns: 'ai' })}
          </button>
          <button
            type="button"
            className={activeSubTab === 'anomalies' ? 'btn-primary' : 'btn-outline'}
            onClick={() => setActiveSubTab('anomalies')}
          >
            🚨 {t('anomaliesTab', { ns: 'ai' })} ({anomalies.length})
          </button>
          <button
            type="button"
            className={activeSubTab === 'support' ? 'btn-primary' : 'btn-outline'}
            onClick={() => setActiveSubTab('support')}
          >
            ✉️ {t('supportTab', { ns: 'ai' })}
          </button>
          <button
            type="button"
            className={activeSubTab === 'providers' ? 'btn-primary' : 'btn-outline'}
            onClick={() => setActiveSubTab('providers')}
          >
            ⚙️ {t('providersTab', { ns: 'ai' })} ({providers.length})
          </button>
        </div>
      </div>

      {/* SUB-TAB: COPILOT */}
      {activeSubTab === 'copilot' && (
        <div>
          <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
            <h3 style={{ marginTop: 0 }}>{t('askQuestion', { ns: 'ai' })}</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>
              Ask questions about sales, active packages, or gateway status. Responses cite verified records.
            </p>

            <form onSubmit={handleAskCopilot}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('askPlaceholder', { ns: 'ai' })}
                  value={copilotQuestion}
                  onChange={(e) => setCopilotQuestion(e.target.value)}
                  required
                />
                <button type="submit" className="btn-primary" disabled={asking}>
                  {asking ? t('asking', { ns: 'ai' }) : t('askBtn', { ns: 'ai' })}
                </button>
              </div>
            </form>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <button
                type="button"
                className="btn-outline"
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}
                onClick={() => setCopilotQuestion('What is our current revenue and sales performance?')}
              >
                Prompt: Revenue summary
              </button>
              <button
                type="button"
                className="btn-outline"
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}
                onClick={() => setCopilotQuestion('How many active sessions and packages do we have?')}
              >
                Prompt: Package &amp; session status
              </button>
            </div>

            {copilotAnswer && (
              <div
                style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-brand-secondary)', fontWeight: 'bold' }}>
                    🤖 Answer (Model: {copilotAnswer.providerUsed})
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                    Routing: {copilotAnswer.freeTierRouting ? 'Free Tier Priority' : 'Paid Tier'}
                  </span>
                </div>
                <p style={{ margin: '0 0 0.75rem 0', lineHeight: '1.5', fontSize: '0.9rem' }}>{copilotAnswer.response}</p>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                  <strong>Verified Sources:</strong> {copilotAnswer.citedSources.join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB: FORECAST */}
      {activeSubTab === 'forecast' && (
        <div>
          <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
            <h3 style={{ marginTop: 0 }}>{t('forecastTitle', { ns: 'ai' })}</h3>
            {forecast ? (
              <div>
                <div className="grid" style={{ marginBottom: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                  <article className="card" style={{ padding: '1rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
                    <h3 style={{ margin: 0 }}>{formatCurrency(forecast.projectedRevenueMinor, currency, currentLang)}</h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                      Projected 7-Day Revenue ({t('uncertaintyBand', { ns: 'ai', percent: forecast.uncertaintyBandPercent })})
                    </p>
                  </article>
                  <article className="card" style={{ padding: '1rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
                    <h3 style={{ margin: 0 }}>~{forecast.projectedSessions} Sessions</h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--color-muted)' }}>Projected Connections (Next 7 Days)</p>
                  </article>
                </div>
              </div>
            ) : (
              <p>{t('loading', { ns: 'common' })}</p>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB: ANOMALIES */}
      {activeSubTab === 'anomalies' && (
        <div>
          <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
            <h3 style={{ marginTop: 0 }}>{t('anomalyTitle', { ns: 'ai' })}</h3>
            {anomalies.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {anomalies.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      background: a.severity === 'high' ? '#fee2e2' : '#fef3c7',
                      border: `1px solid ${a.severity === 'high' ? '#fca5a5' : '#fde68a'}`,
                      borderRadius: '6px',
                      padding: '0.75rem 1rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong style={{ color: a.severity === 'high' ? '#b91c1c' : '#b45309' }}>
                        {a.severity.toUpperCase()}: {a.title}
                      </strong>
                      <small style={{ color: 'var(--color-muted)' }}>
                        {formatTime(a.detectedAt, currentLang)}
                      </small>
                    </div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem' }}>{a.description}</p>
                    <div style={{ fontSize: '0.8rem', color: '#1d4ed8' }}>
                      {t('recommendation', { ns: 'ai', defaultValue: 'Recommendation' })}: {a.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '1rem', background: '#dcfce7', borderRadius: '6px', color: '#166534' }}>
                ✓ {t('noAnomalies', { ns: 'ai' })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB: SUPPORT DRAFTER */}
      {activeSubTab === 'support' && (
        <div>
          <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
            <h3 style={{ marginTop: 0 }}>{t('draftResponse', { ns: 'ai' })}</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>
              Paste customer problem reports. PII is automatically scrubbed before draft synthesis.
            </p>

            <form onSubmit={handleDraftSupport}>
              <div className="form-group">
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder={t('issuePlaceholder', { ns: 'ai' })}
                  value={customerIssue}
                  onChange={(e) => setCustomerIssue(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={drafting}>
                {drafting ? t('drafting', { ns: 'ai' }) : t('draftBtn', { ns: 'ai' })}
              </button>
            </form>

            {supportDraft && (
              <div style={{ marginTop: '1.25rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-success)' }}>Proposed Draft</h4>
                <p style={{ margin: 0, lineHeight: '1.5', whiteSpace: 'pre-line', fontSize: '0.9rem' }}>{supportDraft}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB: PROVIDERS */}
      {activeSubTab === 'providers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>{t('registeredProviders', { ns: 'ai' })}</h3>
            <button type="button" className="btn-primary" onClick={() => setShowAddProvider(true)}>
              + {t('addProvider', { ns: 'ai' })}
            </button>
          </div>

          <div style={{ background: 'white', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', overflowX: 'auto' }}>
            {providers.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '0.65rem 0.85rem' }}>{t('providerType', { ns: 'ai' })}</th>
                    <th style={{ padding: '0.65rem 0.85rem' }}>{t('modelName', { ns: 'ai' })}</th>
                    <th style={{ padding: '0.65rem 0.85rem' }}>{t('freeTier', { ns: 'ai' })}</th>
                    <th style={{ padding: '0.65rem 0.85rem' }}>{t('maskedKey', { ns: 'ai' })}</th>
                    <th style={{ padding: '0.65rem 0.85rem' }}>{t('health', { ns: 'ai' })}</th>
                    <th style={{ padding: '0.65rem 0.85rem' }}>{t('priority', { ns: 'ai' })}</th>
                    <th style={{ padding: '0.65rem 0.85rem' }}>{t('actions', { ns: 'common' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>{p.provider.toUpperCase()}</td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>{p.model}</td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <span className={`badge ${p.isFreeTier ? 'badge-active' : 'badge-inactive'}`}>
                          {p.isFreeTier ? 'Free Tier' : 'Paid Tier'}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', fontFamily: 'monospace' }}>{p.maskedKey}</td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <span className={`badge ${p.health === 'healthy' ? 'badge-active' : 'badge-inactive'}`}>
                          {p.health}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>#{p.priority}</td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <button
                          type="button"
                          className="btn-outline"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                          onClick={() => handleTestProvider(p.id)}
                        >
                          Probe
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-muted)', margin: 0 }}>
                No external AI providers registered.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Add Provider Modal */}
      {showAddProvider && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>{t('addProvider', { ns: 'ai' })}</h3>
            <form onSubmit={handleCreateProvider}>
              <div className="form-group">
                <label className="form-label">{t('providerType', { ns: 'ai' })}</label>
                <select className="form-input" value={newProvider} onChange={(e) => setNewProvider(e.target.value as any)}>
                  <option value="gemini">Google Gemini</option>
                  <option value="groq">Groq</option>
                  <option value="ollama">Ollama (Local)</option>
                  <option value="openai_compatible">OpenAI Compatible</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('modelName', { ns: 'ai' })}</label>
                <input
                  type="text"
                  className="form-input"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  placeholder="gemini-1.5-flash"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('maskedKey', { ns: 'ai' })}</label>
                <input
                  type="password"
                  className="form-input"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="Enter API key..."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button type="button" className="btn-outline" onClick={() => setShowAddProvider(false)}>
                  {t('cancel', { ns: 'common' })}
                </button>
                <button type="submit" className="btn-primary" disabled={savingProvider}>
                  {savingProvider ? t('loading', { ns: 'common' }) : t('save', { ns: 'common' })}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
