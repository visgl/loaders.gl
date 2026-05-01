import {expect, test} from 'vitest';
test('TextEncoder', () => {
  expect(
    new TextEncoder(),
    'TextEncoder successfully instantiated (available or polyfilled)'
  ).toBeTruthy();
});
test('TextDecoder', () => {
  expect(
    new TextDecoder(),
    'TextDecoder successfully instantiated (available or polyfilled)'
  ).toBeTruthy();
});
test('ReadableStream', () => {
  expect(ReadableStream, 'ReadableStream defined').toBeTruthy();
});
