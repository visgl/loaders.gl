const {getESLintConfig, deepMerge} = require('ocular-dev-tools');

const defaultConfig = getESLintConfig({react: '16.8.2'});

// Make any changes to default config here
const config = deepMerge(defaultConfig, {
  parserOptions: {
    project: ['./tsconfig.json']
  },

  env: {
    browser: true,
    es2020: true,
    node: true
  },

  rules: {
    'import/no-unresolved': 1,
    'no-console': 1
    // 'accessor-pairs': ['error', {getWithoutSet: false, setWithoutGet: false}]
  },

  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.d.ts'],
      rules: {
        // TODO - Enable these warnings when we have reduced the total amount of warnings
        // '@typescript-eslint/ban-ts-comment': ['warn'],
        // '@typescript-eslint/ban-types': ['warn'],
        // '@typescript-eslint/no-unsafe-member-access': ['warn'],
        // '@typescript-eslint/no-unsafe-assignment': ['warn'],
        // '@typescript-eslint/no-var-requires': ['warn']
        '@typescript-eslint/ban-ts-comment': 0,
        '@typescript-eslint/ban-types': 0,
        '@typescript-eslint/no-unsafe-member-access': 0,
        '@typescript-eslint/no-unsafe-assignment': 0,
        '@typescript-eslint/no-var-requires': 0,
        // We still have some issues with import resolution
        'import/named': 0,
        'import/no-extraneous-dependencies': ['warn'],
        // Warn instead of error
        'max-params': ['warn'],
        'no-undef': ['warn'],
        camelcase: ['warn'],
        '@typescript-eslint/no-floating-promises': ['warn'],
        '@typescript-eslint/await-thenable': ['warn'],
        '@typescript-eslint/no-misused-promises': ['warn'],
        '@typescript-eslint/restrict-plus-operands': ['warn'],
        '@typescript-eslint/no-empty-function': ['warn'],
        // We use function hoisting
        '@typescript-eslint/no-use-before-define': 0,
        // We always want explicit typing, e.g `field: string = ''`
        '@typescript-eslint/no-inferrable-types': 0,
        '@typescript-eslint/restrict-template-expressions': 0,
        '@typescript-eslint/explicit-module-boundary-types': 0,
        '@typescript-eslint/require-await': 0,
        '@typescript-eslint/no-unsafe-return': 0,
        '@typescript-eslint/no-unsafe-call': 0,
        '@typescript-eslint/no-empty-interface': 0
      }
    },
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
  ],

  settings: {
    // Ensure eslint finds typescript files
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.mjs', '.ts', '.tsx']
      }
    }
  }
});

// config.overrides[1].parserOptions = {
//   project: ['./tsconfig.json']
// };

// Uncomment to log the eslint config
// console.debug(config);

module.exports = config;
