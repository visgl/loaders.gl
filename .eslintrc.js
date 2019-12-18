module.exports = {
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018
  },
  extends: ['eslint-config-uber-es2015', 'prettier'],
  rules: {
    'guard-for-in': 0,
    'generator-star-spacing': 0,
    'func-names': 0,
    'no-inline-comments': 0,
    'no-multi-str': 0,
    'space-before-function-paren': 0
  }
};
