/** @typedef {import('@vis.gl/dev-tools').OcularConfig} OcularConfig */

import {dirname, join} from 'path';
import {fileURLToPath} from 'url';

const packageRoot = dirname(fileURLToPath(import.meta.url));
const testDir = join(packageRoot, 'test');

/** @type {OcularConfig} */
const config = {
  babel: false,

  lint: {
    paths: ['modules', 'apps', 'dev-docs', 'docs', 'test'], //, 'examples'],
    extensions: ['js', 'jsx', 'cjs', 'mjs', 'ts', 'tsx', 'md'] // , 'mdx'],
  },

  // typescript: {
  //   project: 'tsconfig.build.json'
  // },

  aliases: {
    // TEST
    test: testDir
  },

  nodeAliases: {
    '@maplibre/mlt': join(packageRoot, 'modules/mlt/src/libs/mlt-decoder.cjs')
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
    size: 'test/size/import-nothing.js'
  }
};

export default config;
