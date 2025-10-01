import '@testing-library/jest-dom'

// Simple runtime mock for lucide-react to avoid pre-bundled React/runtime issues in tests.
// We replace the icon exports with lightweight functional components.
import { vi } from 'vitest'

vi.mock('lucide-react', () => {
	const React = require('react')
	const make = (name: string) => (props: any) => React.createElement('svg', { 'data-icon': name, ...props })
	return {
		__esModule: true,
		default: undefined,
		ClipboardList: make('ClipboardList'),
		CalendarDays: make('CalendarDays'),
		Megaphone: make('Megaphone'),
		FileText: make('FileText'),
		Gauge: make('Gauge'),
		Activity: make('Activity'),
		FileBarChart2: make('FileBarChart2'),
		MessageCircle: make('MessageCircle'),
		ListChecks: make('ListChecks'),
		Bug: make('Bug'),
		Radar: make('Radar'),
		Inbox: make('Inbox'),
		Mail: make('Mail'),
		TrendingUp: make('TrendingUp')
	}
})
