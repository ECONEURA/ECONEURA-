const React = require('react')

function jsx(type, props, key) {
  return React.createElement(type, props)
}

function jsxs(type, props, key) {
  return React.createElement(type, props)
}

const Fragment = React.Fragment

function jsxDEV(type, props, key) {
  return React.createElement(type, props)
}

module.exports = { jsx, jsxs, Fragment, jsxDEV }
