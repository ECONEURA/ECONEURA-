// Minimal OpenTelemetry stub used in tests
export function initTracer(name = 'app') {
	return { name, started: true }
}

export function shutdownTracer() {
	return Promise.resolve(true)
}


