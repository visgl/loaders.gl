module.exports = {
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018
  },
  extends: ['uber-es2015', 'prettier', 'plugin:import/errors'],
  plugins: ['import'],
  globals: {
    globalThis: 'readonly',
    __VERSION__: 'readonly'
  },
  rules: {
    'guard-for-in': 0,
    'generator-star-spacing': 0,
    'func-names': 0,
    'no-inline-comments': 0,
    'no-multi-str': 0,
    'space-before-function-paren': 0,
    'import/no-unresolved': ['error'],
    'import/no-extraneous-dependencies': ['error', {devDependencies: false, peerDependencies: true}]
  },
  overrides: [
    // tests are run with aliases set up in node and webpack.
    // This means lint will not find the imported files and generate false warnings
    {
      // scripts use devDependencies
      files: ['**/test/**/*.js', '**/scripts/**/*.js', '*.config.js', '*.config.local.js'],
      rules: {
        'import/no-unresolved': 0,
        'import/no-extraneous-dependencies': 0
      }
    },
    {
      files: ['examples/**/*.js'],
      rules: {
        'import/no-unresolved': 0
      }
    }
  ]
};
