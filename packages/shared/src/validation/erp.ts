// Minimal ERP validation placeholders
export function validateInvoice(payload: any) {
	return !!(payload && payload.total)
}

export function validateCustomer(payload: any) {
	return !!(payload && payload.name)
}
