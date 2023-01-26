// loaders.gl, MIT license

import test from 'tape-promise/tape';
// import {validateLoader} from 'test/common/conformance';

import {WMSErrorLoader} from '@loaders.gl/wms';
import {parse} from '@loaders.gl/core';

import {ERROR_TEST_CASES} from '../data/wms/errors';

test('WMSErrorLoader#test cases', async (t) => {
  for (const tc of ERROR_TEST_CASES) {
    const error = (await parse(tc.xml, WMSErrorLoader)) as string;
    t.equal(error, tc.parsed, `Error message: "${error}"`);
  }
  t.end();
});
