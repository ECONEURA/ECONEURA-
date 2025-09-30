import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EconeuraCockpit from './EconeuraCockpit.tsx';
// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;
describe('EconeuraCockpit', () => {
    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        // Reset global state
        delete globalThis.__ECONEURA_BEARER;
    });
    describe('Login Flow', () => {
        it('should show login button initially', () => {
            render(_jsx(EconeuraCockpit, {}));
            expect(screen.getByText('INICIAR SESIÓN')).toBeInTheDocument();
            expect(screen.queryByPlaceholderText('Buscar...')).not.toBeInTheDocument();
        });
        it('should login and show cockpit interface', async () => {
            const user = userEvent.setup();
            render(_jsx(EconeuraCockpit, {}));
            const loginButton = screen.getByText('INICIAR SESIÓN');
            await act(async () => {
                await user.click(loginButton);
            });
            expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
            expect(screen.getByText('OKR Agent')).toBeInTheDocument();
            expect(screen.getByText('Flow Agent')).toBeInTheDocument();
            expect(screen.getByText('Integration Agent')).toBeInTheDocument();
        });
        it('should set bearer token on login', async () => {
            const user = userEvent.setup();
            render(_jsx(EconeuraCockpit, {}));
            await act(async () => {
                await user.click(screen.getByText('INICIAR SESIÓN'));
            });
            expect(globalThis.__ECONEURA_BEARER).toBe('mock-token-123');
        });
    });
    describe('Agent Search', () => {
        beforeEach(async () => {
            const user = userEvent.setup();
            render(_jsx(EconeuraCockpit, {}));
            await user.click(screen.getByText('INICIAR SESIÓN'));
        });
        it('should filter agents by name', async () => {
            const user = userEvent.setup();
            const searchInput = screen.getByPlaceholderText('Buscar...');
            await act(async () => {
                await user.type(searchInput, 'OKR');
            });
            expect(screen.getByText('OKR Agent')).toBeInTheDocument();
            expect(screen.queryByText('Flow Agent')).not.toBeInTheDocument();
            expect(screen.queryByText('Integration Agent')).not.toBeInTheDocument();
        });
        it('should filter agents by description', async () => {
            const user = userEvent.setup();
            const searchInput = screen.getByPlaceholderText('Buscar...');
            await act(async () => {
                await user.type(searchInput, 'flujos');
            });
            expect(screen.getByText('Flow Agent')).toBeInTheDocument();
            expect(screen.queryByText('OKR Agent')).not.toBeInTheDocument();
            expect(screen.queryByText('Integration Agent')).not.toBeInTheDocument();
        });
        it('should show all agents when search is empty', () => {
            expect(screen.getByText('OKR Agent')).toBeInTheDocument();
            expect(screen.getByText('Flow Agent')).toBeInTheDocument();
            expect(screen.getByText('Integration Agent')).toBeInTheDocument();
        });
    });
    describe('Agent Execution', () => {
        it('should execute agent and show result in activity log', async () => {
            const user = userEvent.setup();
            render(_jsx(EconeuraCockpit, {}));
            await act(async () => {
                await user.click(screen.getByText('INICIAR SESIÓN'));
            });
            // Mock successful fetch response
            mockFetch.mockResolvedValueOnce({
                json: () => Promise.resolve({ success: true, result: 'Agent executed' })
            });
            const executeButton = screen.getAllByText('Ejecutar')[0]; // OKR Agent button
            await act(async () => {
                await user.click(executeButton);
            });
            await waitFor(() => {
                expect(screen.getByText(/Agent okr:/)).toBeInTheDocument();
            });
            expect(mockFetch).toHaveBeenCalledWith('/api/agents/okr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-token-123'
                },
                body: JSON.stringify({ input: '' })
            });
        });
        it('should handle agent execution errors', async () => {
            const user = userEvent.setup();
            render(_jsx(EconeuraCockpit, {}));
            await act(async () => {
                await user.click(screen.getByText('INICIAR SESIÓN'));
            });
            // Clear previous mocks and set up error mock
            vi.clearAllMocks();
            mockFetch.mockRejectedValueOnce(new Error('Network error'));
            const executeButton = screen.getAllByText('Ejecutar')[1]; // Flow Agent button
            await act(async () => {
                await user.click(executeButton);
            });
            await waitFor(() => {
                expect(screen.getByText(/Error invoking flow:/)).toBeInTheDocument();
            });
        });
        it('should accumulate activity log entries', async () => {
            const user = userEvent.setup();
            render(_jsx(EconeuraCockpit, {}));
            await act(async () => {
                await user.click(screen.getByText('INICIAR SESIÓN'));
            });
            // First execution - error
            mockFetch.mockRejectedValueOnce(new Error('Network error'));
            await act(async () => {
                await user.click(screen.getAllByText('Ejecutar')[0]);
            });
            // Second execution - success
            mockFetch.mockResolvedValueOnce({
                json: () => Promise.resolve({ success: true, result: 'Agent executed' })
            });
            await act(async () => {
                await user.click(screen.getAllByText('Ejecutar')[1]);
            });
            await waitFor(() => {
                expect(screen.getByText(/Error invoking okr:/)).toBeInTheDocument();
                expect(screen.getByText(/Agent flow:/)).toBeInTheDocument();
            });
        });
    });
    describe('UI Structure', () => {
        it('should render main cockpit title', () => {
            render(_jsx(EconeuraCockpit, {}));
            expect(screen.getByText('ECONEURA Cockpit')).toBeInTheDocument();
        });
        it('should have proper semantic structure', async () => {
            const user = userEvent.setup();
            render(_jsx(EconeuraCockpit, {}));
            await act(async () => {
                await user.click(screen.getByText('INICIAR SESIÓN'));
            });
            expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
            expect(screen.getByText('Actividad')).toBeInTheDocument();
        });
        it('should display agent cards with proper information', async () => {
            const user = userEvent.setup();
            render(_jsx(EconeuraCockpit, {}));
            await act(async () => {
                await user.click(screen.getByText('INICIAR SESIÓN'));
            });
            expect(screen.getByText('OKR Agent')).toBeInTheDocument();
            expect(screen.getByText('Gestión de OKRs')).toBeInTheDocument();
            expect(screen.getByText('Flow Agent')).toBeInTheDocument();
            expect(screen.getByText('Gestión de flujos')).toBeInTheDocument();
        });
    });
});
