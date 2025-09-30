import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
const agents = [
    { id: 'okr', name: 'OKR Agent', description: 'Gestión de OKRs' },
    { id: 'flow', name: 'Flow Agent', description: 'Gestión de flujos' },
    { id: 'integration', name: 'Integration Agent', description: 'Integraciones' }
];
export default function EconeuraCockpit() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [activity, setActivity] = useState([]);
    const filteredAgents = agents.filter(agent => agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const handleLogin = () => {
        setIsLoggedIn(true);
        globalThis.__ECONEURA_BEARER = 'mock-token-123';
    };
    const invokeAgent = async (agentId) => {
        try {
            const response = await fetch(`/api/agents/${agentId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${globalThis.__ECONEURA_BEARER}`
                },
                body: JSON.stringify({ input: '' })
            });
            const result = await response.json();
            setActivity(prev => [...prev, `Agent ${agentId}: ${JSON.stringify(result)}`]);
        }
        catch (error) {
            setActivity(prev => [...prev, `Error invoking ${agentId}: ${error}`]);
        }
    };
    return (_jsxs("div", { className: "econeura-cockpit", children: [_jsx("h1", { children: "ECONEURA Cockpit" }), !isLoggedIn ? (_jsx("button", { onClick: handleLogin, children: "INICIAR SESI\u00D3N" })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "search-bar", children: _jsx("input", { type: "text", placeholder: "Buscar...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) }) }), _jsx("div", { className: "agents-grid", children: filteredAgents.map(agent => (_jsxs("div", { className: "agent-card", children: [_jsx("h3", { children: agent.name }), _jsx("p", { children: agent.description }), _jsx("button", { onClick: () => invokeAgent(agent.id), children: "Ejecutar" })] }, agent.id))) }), _jsxs("div", { className: "activity-log", children: [_jsx("h2", { children: "Actividad" }), activity.map((item, index) => (_jsx("div", { className: "activity-item", children: item }, index)))] })] }))] }));
}
