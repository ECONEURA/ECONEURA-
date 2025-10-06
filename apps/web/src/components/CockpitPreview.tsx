import React from 'react';
export default function CockpitPreview() {
  return (
    <div style={{ padding: 16, fontFamily: 'ui-sans-serif' }}>
      <h1>ECONEURA Cockpit</h1>
      <p>Stub temporal para desbloquear el editor mientras se despliega.</p>
      <p>Endpoint IA: {(globalThis as any).ECONEURA_AI_ENDPOINT || '/api/ai'}</p>
    </div>
  );
}
