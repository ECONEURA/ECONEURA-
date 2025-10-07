import React, { useEffect, useRef, useState } from 'react';

const AI_ENDPOINT = (globalThis as any)?.ECONEURA_AI_ENDPOINT || '/api/ai';

export default function CockpitPreview() {
  const theme = {
    bg: '#f8fafc',
    surface: '#ffffff',
    ink: '#0f172a',
    muted: '#64748b',
    border: '#e6eef6',
  } as const;

  const [aiEndpoint] = useState<string>(AI_ENDPOINT);
  const [chatOpen, setChatOpen] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('ECONEURA_USER') : null;
      const u = raw ? JSON.parse(raw) : null;
      if (u) setUser(u);
    } catch (_) {
      /* ignore */
    }
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: 'ui-sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{ width: 28, height: 28, borderRadius: 9999, background: '#fff', border: '2px solid #111827' }}
          />
          <div style={{ fontWeight: 700 }}>ECONEURA Cockpit Preview V8</div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input ref={searchRef} placeholder="Buscar..." style={{ padding: 6 }} />
          {!user ? (
            <button style={{ padding: '6px 10px' }} onClick={() => setUser({ email: 'demo@econeura.local' })}>
              Login
            </button>
          ) : (
            <span style={{ color: theme.muted, fontSize: 12 }}>{user.email}</span>
          )}
        </div>
      </header>

      <main style={{ marginTop: 12 }}>
        <p style={{ margin: 0, color: theme.muted }}>Stub restaurado desde backup en repo. Endpoint IA: {aiEndpoint}</p>
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => setChatOpen(true)}
            style={{ padding: '8px 12px', background: '#111827', color: '#fff', borderRadius: 6 }}
          >
            Abrir chat
          </button>
        </div>
      </main>

      <footer style={{ marginTop: 20, fontSize: 12, color: theme.muted }}>
        <div>GDPR · TLS 1.2+ · ECONEURA 2025</div>
      </footer>
    </div>
  );
}
