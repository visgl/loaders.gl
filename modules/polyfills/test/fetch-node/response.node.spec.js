// Based on https://github.com/github/fetch under MIT license

import test from 'tape-promise/tape';
import '@loaders.gl/polyfills';

// https://fetch.spec.whatwg.org/#response-class
// Run the tests both under browser and Node (ensures they conform to built-in)
test('constructor response', (t) => {
  const response = new Response('', {});
  t.ok(response, 'Response constructed.');
  t.end();
});
