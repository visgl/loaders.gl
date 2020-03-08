const {resolve} = require('path');

module.exports = {
  lint: {
    // TODO - comment out while getting typescript to work
    paths: ['dev-docs', 'docs', 'modules'], // , 'test', 'website', 'examples'],
    extensions: ['js', 'md']
  },

  aliases: {
    test: resolve(__dirname, 'test')
  },

  entry: {
    test: 'test/node.js',
    'test-browser': 'test/browser.js',
    bench: 'test/bench/index.js',
    'bench-browser': 'test/bench/browser.js',
    size: 'test/size/import-nothing.js'
  }
};
