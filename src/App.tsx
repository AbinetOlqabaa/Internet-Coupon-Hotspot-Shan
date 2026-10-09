/**
 * Minimal Technical Kernel Health & Status Page
 * Internet Coupon Hotspot Project
 */
import { useEffect, useState, useCallback } from 'react';
import {
  Server,
  Smartphone,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Layers,
  Terminal,
  Clock,
  ShieldCheck,
  Cpu,
  FileCode2,
} from 'lucide-react';

interface HealthResponse {
  status: string;
  service: string;
  uptime: number;
  timestamp: string;
  environment: string;
  nodeVersion: string;
  androidReadiness?: {
    capacitorCompatible: boolean;
    networkLayerSeparated: boolean;
    businessLogicDeferred: boolean;
  };
}

export default function App() {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const startTime = performance.now();
    try {
      const response = await fetch('/api/health', {
        headers: { Accept: 'application/json' },
      });
      const endTime = performance.now();
      setLatencyMs(Math.round(endTime - startTime));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: HealthResponse = await response.json();
      setHealthData(data);
      setLastChecked(new Date());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown communication error';
      setError(message);
      setHealthData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Banner */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/10">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold tracking-tight text-white flex items-center gap-2">
                Internet Coupon Hotspot
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-cyan-950 border border-cyan-800 text-cyan-300">
                  Kernel v0.1.0
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Technical landing environment & boundary verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                healthData?.status === 'ok'
                  ? 'bg-emerald-950/60 border-emerald-600/40 text-emerald-300'
                  : error
                  ? 'bg-rose-950/60 border-rose-600/40 text-rose-300'
                  : 'bg-amber-950/60 border-amber-600/40 text-amber-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  healthData?.status === 'ok'
                    ? 'bg-emerald-400 animate-pulse'
                    : error
                    ? 'bg-rose-400'
                    : 'bg-amber-400 animate-ping'
                }`}
              />
              {isLoading ? 'Checking...' : healthData?.status === 'ok' ? 'Online' : 'Degraded'}
            </div>

            <button
              onClick={checkHealth}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 active:bg-slate-850 text-slate-200 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Ping API
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6 flex-1">
        {/* Kernel Objective Notice */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-0.5 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-slate-200">
                Phase 0: Technical Kernel Landing Environment
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                This project is intentionally a minimal runtime kernel established to verify the
                full-stack communication boundary and build pipeline. Application features
                (coupon issuing, customer database, hotspot network management, payment accounting)
                remain strictly deferred until the complete <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded font-mono text-xs">.ai</code> instruction pack is imported.
              </p>
            </div>
          </div>
        </div>

        {/* Backend Endpoint Communication Status Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                Full-Stack Boundary Verification (<code className="text-xs text-cyan-300 font-mono">/api/health</code>)
              </h3>
            </div>
            {latencyMs !== null && (
              <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                {latencyMs}ms RTT
              </span>
            )}
          </div>

          <div className="p-5 space-y-4">
            {error ? (
              <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-4 flex items-start gap-3 text-rose-200 text-xs sm:text-sm">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Backend communication check failed</p>
                  <p className="text-rose-300/80 mt-1">{error}</p>
                </div>
              </div>
            ) : healthData ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium block">
                    Endpoint Status
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-300 capitalize">
                      {healthData.status}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium block">
                    Environment
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 text-slate-200 font-mono text-xs">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{healthData.environment}</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium block">
                    Server Uptime
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 text-slate-200 font-mono text-xs">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{healthData.uptime}s</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium block">
                    Runtime Version
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 text-slate-200 font-mono text-xs">
                    <Terminal className="w-3.5 h-3.5 text-purple-400" />
                    <span>{healthData.nodeVersion}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                Pinging backend runtime...
              </div>
            )}

            {/* Raw JSON inspection block */}
            <div className="bg-slate-950 rounded-xl border border-slate-800/80 p-3 overflow-x-auto">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-850 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-mono">
                  <FileCode2 className="w-3.5 h-3.5 text-slate-500" />
                  GET /api/health Response Payload
                </span>
                {lastChecked && (
                  <span className="text-[11px] text-slate-500">
                    Checked {lastChecked.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <pre className="text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto">
                {healthData ? JSON.stringify(healthData, null, 2) : error || '// No response payload'}
              </pre>
            </div>
          </div>
        </div>

        {/* Future Android & Architecture Read-State */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
              <Smartphone className="w-4 h-4" />
              <h4>Android Packaging Readiness</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Responsive viewport geometry configured for mobile phones, tablets, and desktop
              inspection. Clean separation between UI layers and runtime allows direct wrapping
              via Capacitor or WebView without architectural friction.
            </p>
            <div className="text-xs text-slate-400 space-y-1.5 pt-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Responsive touch-friendly interface</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero premature native device locks or permissions</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>External network gateway abstraction reserved for Phase 1+</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
              <Terminal className="w-4 h-4" />
              <h4>Technical Kernel Scope Gates</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Business features are intentionally not created. No mock coupons, no dummy customer
              records, and no speculative network managers are present.
            </p>
            <div className="text-xs text-slate-400 space-y-1.5 pt-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>TypeScript build & compilation verified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vite SPA + Express server mounted</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Awaiting author .ai ZIP archive upload</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 px-4 text-center">
        <p className="text-xs text-slate-500 font-mono">
          Internet Coupon Hotspot Kernel • Production-Oriented Landing Baseline • Awaiting .ai Archive
        </p>
      </footer>
    </div>
  );
}
