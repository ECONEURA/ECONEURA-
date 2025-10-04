import React from 'react'

// Minimal dev runtime shim used during tests. It provides the same named
// exports that the JSX transform expects: jsx, jsxs, Fragment.
export function jsx(type, props, key) {
  return React.createElement(type, props)
}

export function jsxs(type, props, key) {
  return React.createElement(type, props)
}

export const Fragment = React.Fragment

// Provide jsxDEV for dev-mode runtime imports that Vitest or transforms may use.
export function jsxDEV(type, props, key) {
  return React.createElement(type, props)
}

export default { jsx, jsxs, Fragment, jsxDEV }
