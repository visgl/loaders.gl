import {expect, test} from 'vitest';
import {
  getErrorMessageFromResponseSync,
  getErrorMessageFromResponse
} from '@loaders.gl/core/lib/fetch/fetch-error-message';
test('getErrorMessageFromResponseSync#imports', () => {
  expect(
    typeof getErrorMessageFromResponseSync === 'function',
    'getErrorMessageFromResponseSync() defined'
  ).toBeTruthy();
  expect(
    typeof getErrorMessageFromResponse === 'function',
    'getErrorMessageFromResponse() defined'
  ).toBeTruthy();
});
