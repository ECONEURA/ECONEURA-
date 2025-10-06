// Minimal ai client placeholder
export function createAIClient() {
  return {
    generate: async (prompt = '') => ({ text: `echo: ${prompt}` }),
  };
}

export function parseAIResponse(resp: any) {
  return resp?.text ?? '';
}
