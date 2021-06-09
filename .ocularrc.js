const {resolve} = require('path');

module.exports = {
  babel: {
    extensions: ['.js', '.jsx', '.mjs', '.ts', '.tsx']
  },
  lint: {
    // TODO - comment out while getting typescript to work
    paths: ['dev-docs', 'docs', 'modules'], // 'examples', test', 'website', 'examples'],
    extensions: ['js', 'jsx', 'mjs', 'ts', 'tsx', 'md']
  },

  aliases: {
    test: resolve(__dirname, 'test')
  },

  entry: {
    test: 'test/node.js',
    'test-browser': 'test/browser.js',
    bench: 'test/bench/node.js',
    'bench-browser': 'test/bench/browser.js',
    size: 'test/size/import-nothing.js'
  }
};
