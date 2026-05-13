import {expect, test} from 'vitest';

// https://fetch.spec.whatwg.org/#response-class
// Run the tests both under browser and Node (ensures they conform to built-in)
test('constructor response', () => {
  const response = new Response('', {});
  expect(response, 'Response constructed.').toBeTruthy();
});
