import React, { useState } from 'react';

interface Agent {
  id: string;
  name: string;
  description: string;
}

const agents: Agent[] = [
  { id: 'okr', name: 'OKR Agent', description: 'Gestión de OKRs' },
  { id: 'flow', name: 'Flow Agent', description: 'Gestión de flujos' },
  { id: 'integration', name: 'Integration Agent', description: 'Integraciones' }
];

export default function EconeuraCockpit() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activity, setActivity] = useState<string[]>([]);

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogin = () => {
    setIsLoggedIn(true);
    (globalThis as any).__ECONEURA_BEARER = 'mock-token-123';
  };

  const invokeAgent = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(globalThis as any).__ECONEURA_BEARER}`
        },
        body: JSON.stringify({ input: '' })
      });

      const result = await response.json();
      setActivity(prev => [...prev, `Agent ${agentId}: ${JSON.stringify(result)}`]);
    } catch (error) {
      setActivity(prev => [...prev, `Error invoking ${agentId}: ${error}`]);
    }
  };

  return (
    <div className="econeura-cockpit">
      <h1>ECONEURA Cockpit</h1>

      {!isLoggedIn ? (
        <button onClick={handleLogin}>INICIAR SESIÓN</button>
      ) : (
        <>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="agents-grid">
            {filteredAgents.map(agent => (
              <div key={agent.id} className="agent-card">
                <h3>{agent.name}</h3>
                <p>{agent.description}</p>
                <button onClick={() => invokeAgent(agent.id)}>Ejecutar</button>
              </div>
            ))}
          </div>

          <div className="activity-log">
            <h2>Actividad</h2>
            {activity.map((item, index) => (
              <div key={index} className="activity-item">{item}</div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}