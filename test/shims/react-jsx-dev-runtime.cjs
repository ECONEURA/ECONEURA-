// CommonJS shim that re-exports the exact helper functions from react/jsx-dev-runtime
const real = require('react/jsx-dev-runtime');

module.exports = {
  jsxDEV: real.jsxDEV,
  Fragment: real.Fragment,
  default: real.default || real,
};
