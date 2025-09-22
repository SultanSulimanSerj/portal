module.exports = {
  extends: [
    './eslint-preset.js'
  ],
  env: {
    node: true,
    es6: true
  },
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module'
  },
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off'
  }
};