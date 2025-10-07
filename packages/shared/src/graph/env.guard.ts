// Minimal env guard placeholder
export function ensureGraphEnv(vars: Record<string, any> = {}) {
  // returns true if required minimal keys exist
  return !!(vars['GRAPH_URL'] || process.env.GRAPH_URL);
}

export function requireGraphEnvOrThrow(vars: Record<string, any> = {}) {
  if (!ensureGraphEnv(vars)) throw new Error('GRAPH env missing');
  return true;
}
