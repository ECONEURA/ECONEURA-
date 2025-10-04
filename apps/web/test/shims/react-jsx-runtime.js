// ESM shim for react/jsx-runtime used during tests.
// Provide minimal implementations by delegating to React.createElement
import React from 'react'

export function jsx(type, props, key) {
  // React.createElement handles key inside props for React 18+ usage
  return React.createElement(type, props)
}

export function jsxs(type, props, key) {
  return React.createElement(type, props)
}

// Some transforms (especially in dev mode) import jsxDEV from the dev runtime.
// Provide a compatible implementation that forwards to React.createElement.
export function jsxDEV(type, props, key) {
  return React.createElement(type, props)
}

export const Fragment = React.Fragment

export default { jsx, jsxs, Fragment, jsxDEV }
