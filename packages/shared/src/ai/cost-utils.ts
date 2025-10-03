// Minimal AI cost estimation helper used in tests to exercise exports.
export function estimateAICost(tokens: number, pricePerToken = 0.0001) {
	if (!tokens || tokens <= 0) return 0
	return tokens * pricePerToken
}

export function formatCostEur(cents: number) {
	return `${(cents / 100).toFixed(4)}€`
}
