import test from 'tape-promise/tape';

import {
  getErrorMessageFromResponseSync,
  getErrorMessageFromResponse
} from '@loaders.gl/core/lib/fetch/fetch-error-message';

test('getErrorMessageFromResponseSync#imports', (t) => {
  t.ok(
    typeof getErrorMessageFromResponseSync === 'function',
    'getErrorMessageFromResponseSync() defined'
  );
  t.ok(typeof getErrorMessageFromResponse === 'function', 'getErrorMessageFromResponse() defined');
  t.end();
});
