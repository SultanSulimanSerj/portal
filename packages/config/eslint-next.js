module.exports = {
  extends: [
    './eslint-preset.js',
    'next/core-web-vitals'
  ],
  env: {
    browser: true,
    node: true,
    es6: true
  }
};