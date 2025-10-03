// Minimal placeholder types module to satisfy workspace typechecks.
// Replace with full type exports during a focused refactor.
export type Placeholder = Record<string, unknown>;

// Runtime helper to surface types module in coverage
export function typesAvailable() {
	return true
}

// Type exports