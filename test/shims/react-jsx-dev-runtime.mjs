// ESM shim that imports React's jsx-dev-runtime and re-exports the expected helper
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const realDev = require('react/jsx-dev-runtime');
const React = require('react');

const getReal = (obj, name) => {
	if (!obj) return undefined;
	if (typeof obj[name] === 'function') return obj[name];
	if (obj.default && typeof obj.default[name] === 'function') return obj.default[name];
	return undefined;
};

export function jsxDEV(type, props, key, source, self) {
	const fn = getReal(realDev, 'jsxDEV');
	if (typeof fn === 'function') return fn(type, props, key, source, self);
	const rt = getReal(realDev, 'jsx') || getReal(require('react/jsx-runtime'), 'jsx');
	if (typeof rt === 'function') return rt(type, props, key);
	return React.createElement(type, props);
}

export const Fragment = realDev && (realDev.Fragment || (realDev.default && realDev.default.Fragment)) || React.Fragment;
export default realDev;
