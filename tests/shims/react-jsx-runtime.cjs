// CommonJS shim that re-exports the exact helper functions from react/jsx-runtime
const real = require('react/jsx-runtime');

module.exports = {
  jsx: real.jsx,
  jsxs: real.jsxs,
  Fragment: real.Fragment,
  default: real.default || real,
};
