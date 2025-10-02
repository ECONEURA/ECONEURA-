// ESM shim that imports React's jsx-runtime and re-exports the expected named helpers
// We explicitly re-export functions to avoid ESM/CJS interop issues where
// the expected named exports (jsx, jsxs, Fragment) might be wrapped under default.
import { createRequire } from 'module';

// Use Node resolution to load the real react runtime and react implementation
// This avoids importing 'react/jsx-runtime' which is aliased to this shim and
// would cause infinite recursion.
const require = createRequire(import.meta.url);
const realRuntime = require('react/jsx-runtime');
const React = require('react');

// Helpers to read potential locations (top-level or default)
const getReal = (obj, name) => {
	if (!obj) return undefined;
	if (typeof obj[name] === 'function') return obj[name];
	if (obj.default && typeof obj.default[name] === 'function') return obj.default[name];
	return undefined;
};

// Export real function declarations so consumers receive actual function identities.
export function jsx(type, props, key) {
	const fn = getReal(realRuntime, 'jsx');
	if (typeof fn === 'function') return fn(type, props, key);
	return React.createElement(type, props);
}

export function jsxs(type, props, key) {
	const fn = getReal(realRuntime, 'jsxs') || getReal(realRuntime, 'jsx');
	if (typeof fn === 'function') return fn(type, props, key);
	return React.createElement(type, props);
}

export const Fragment = realRuntime && (realRuntime.Fragment || (realRuntime.default && realRuntime.default.Fragment)) || React.Fragment;

export default realRuntime;
