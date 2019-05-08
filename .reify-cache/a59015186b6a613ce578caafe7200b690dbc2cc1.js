"use strict";function parseTextSync(text, options) {
  return JSON.parse(text);
}

module.exportDefault({
  name: 'JSON',
  extensions: ['json'],
  testText: null,
  parseTextSync
});
