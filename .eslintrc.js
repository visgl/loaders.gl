const {getESLintConfig, deepMerge} = require('ocular-dev-tools');

const defaultConfig = getESLintConfig({react: '16.8.2'});

// Make any changes to default config here
const config = deepMerge(defaultConfig, {
  env: {
    browser: true,
    es2020: true,
    node: true
  },

  rules: {
    // 'accessor-pairs': ['error', {getWithoutSet: false, setWithoutGet: false}]
  },

  overrides: [
    {
      // scripts use devDependencies
      files: ['*worker*.js', '**/worker-utils/**/*.js'],
      env: {
        browser: true,
        es2020: true,
        node: true,
        worker: true
      }
    },
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
});

// Uncomment to log the eslint config
// console.debug(config);

module.exports = config;
