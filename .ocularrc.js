/** @typedef {import('ocular-dev-tools').OcularConfig} OcularConfig */

import {dirname, join} from 'path';
import {fileURLToPath} from 'url';

const packageRoot = dirname(fileURLToPath(import.meta.url));
const devModules = join(packageRoot, 'dev-modules');
const testDir = join(packageRoot, 'test');

/** @type {OcularConfig} */
const config = {
  babel: false,

  lint: {
    paths: ['modules', 'dev-docs', 'docs'], // , 'test', 'examples'],
    extensions: ['js', 'ts']
    // extensions: ['js', 'jsx', 'mjs', 'ts', 'tsx', 'md']
  },

  typescript: {
    project: 'tsconfig.build.json'
  },

  aliases: {
    // TEST
    test: testDir
  },

  coverage: {
    test: 'browser'
  },

  bundle: {
    globalName: 'loaders',
    externals: ['fs', 'path', 'util', 'events', 'stream', 'crypto', 'http', 'https'],
    target: ['chrome110', 'firefox110', 'safari15'],
    format: 'umd',
    globals: {
      '@loaders.gl/*': 'globalThis.loaders'
    }
  },

  entry: {
    test: 'test/node.ts',
    'test-browser': 'test/browser.ts',
    bench: 'test/bench/node.js',
    'bench-browser': 'test/bench/browser.js',
    size: 'test/size/import-nothing.js'
  }
  // entry: {
  //   test: 'test/index.ts',
  //   'test-browser': 'test/browser.ts',
  //   bench: 'test/bench/index.js',
  //   'bench-browser': 'test/bench/browser.js',
  //   size: 'test/size/import-nothing.js'
  // }
};

export default config;
