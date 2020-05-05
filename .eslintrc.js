module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    commonjs: true,
    node: true
  },
  extends: 'eslint:recommended',
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    getApp: false,
    Page: false,
    my: false,
    App: false,
    getCurrentPages: false,
    Component: false
  },
  parser: "babel-eslint",
  parserOptions: {
    ecmaVersion: 2015
  },
  rules: {
    indent: ['error', 2],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'no-console': 1
  }
}
