// Minimal flows client placeholder
export function createFlowsClient() {
	return {
		startFlow: async (id: string) => ({ id, started: true }),
	}
}

export function isFlowId(id: any) {
	return typeof id === 'string' && id.length > 0
}
