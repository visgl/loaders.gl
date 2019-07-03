import test from 'tape-promise/tape';

import {_getErrorMessageFromResponseSync, _getErrorMessageFromResponse} from '@loaders.gl/core';
// NOTE: addAliases is not a public export, already used by test setup
// import {addAliases} from '@loaders.gl/core';

test('file aliases#imports', t => {
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
