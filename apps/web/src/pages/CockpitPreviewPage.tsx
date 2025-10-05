import React, { useEffect, useState } from 'react';
import CockpitPreview from '../components/CockpitPreview';

export default function CockpitPreviewPage(){
  // simple wrapper that ensures AI endpoint is configurable from query string for local preview
  const [endpoint, setEndpoint] = useState<string|undefined>(undefined);
  useEffect(()=>{
    try{
      const params = new URLSearchParams(window.location.search);
      const ep = params.get('ai') || '/dev-mock-ai';
      (globalThis as any).ECONEURA_AI_ENDPOINT = ep;
      setEndpoint(ep);
    }catch(_){ setEndpoint('/dev-mock-ai'); }
  },[]);

  return (
    <div style={{ padding: 18 }}>
      <h2 style={{ marginBottom: 12 }}>Cockpit Preview</h2>
      <p style={{ marginBottom: 12, color: '#6b7280' }}>Endpoint: <code>{endpoint}</code> — puedes añadir <code>?ai=/dev-mock-ai</code> a la URL</p>
      <CockpitPreview />
    </div>
  );
}
