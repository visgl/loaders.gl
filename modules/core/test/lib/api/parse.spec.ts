import {test} from 'vitest';
import {isBrowser} from '@loaders.gl/core';

// const JSON_DATA = [{col1: 22, col2: 'abc'}];
// const JSONLoader = {
//   name: 'JSON',
//   extensions: ['json'],
//   testText: null,
//   parseTextSync: JSON.parse
// };

test.runIf(isBrowser)('parse#Blob (text)', async () => {});

test.runIf(isBrowser)('parse#Blob (binary)', async () => {
  console.log('Not implemented...');
});

test.runIf(isBrowser)('parse#Blob (streaming parser)', async () => {
  console.log('Not implemented...');
});
