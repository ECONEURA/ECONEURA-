// Minimal CRM validation placeholders
export function validateCompany(payload: any) {
	return !!(payload && payload.name)
}

export function validateContact(payload: any) {
	return !!(payload && (payload.email || payload.name))
}
