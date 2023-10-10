import {resolve} from 'path';

export default {
  aliases: {
    test: resolve('./test')
  },

  typescript: {
    project: 'tsconfig.build.json'
  },

  bundle: {
    globalName: 'loader',
    externals: ['fs', 'path', 'util', 'events', 'stream', 'crypto', 'http', 'https'],
    target: ['supports async-functions', 'not dead'],
    format: 'umd',
    globals: {
      '@loaders.gl/*': 'globalThis.loaders'
    }
  },

  lint: {
    // TODO - comment out while getting typescript to work
    paths: ['dev-docs', 'docs', 'modules'] // 'examples', test', 'website', 'examples'],
    // extensions: ['js', 'jsx', 'mjs', 'ts', 'tsx', 'md']
  },

  webpack: {},

  entry: {
    test: 'test/node.ts',
    'test-browser': 'test/browser.ts',
    bench: 'test/bench/node.js',
    'bench-browser': 'test/bench/browser.js',
    size: 'test/size/import-nothing.js'
  }
};
