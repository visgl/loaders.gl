import test from 'tape-promise/tape';

import {_getErrorMessageFromResponseSync, _getErrorMessageFromResponse} from '@loaders.gl/core';

test('_getErrorMessageFromResponseSync#imports', t => {
  t.ok(
    typeof _getErrorMessageFromResponseSync === 'function',
    '_getErrorMessageFromResponseSync() defined'
  );
  t.ok(
    typeof _getErrorMessageFromResponse === 'function',
    '_getErrorMessageFromResponse() defined'
  );
  t.end();
});
