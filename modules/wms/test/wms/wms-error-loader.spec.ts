// loaders.gl, MIT license

import test from 'tape-promise/tape';
// import {validateLoader} from 'test/common/conformance';

import {WMSErrorLoader} from '@loaders.gl/wms';
import {parse} from '@loaders.gl/core';

export const ERROR_TEST_CASES: {xml: string; parsed: string}[] = [
  {
    parsed: 'missing parameters [\'version\', \'layer\', \'format\']',
    xml: `\
<?xml version="1.0"?>
<!DOCTYPE ServiceExceptionReport SYSTEM "http://schemas.opengis.net/wms/1.1.1/exception_1_1_1.dtd">
<ServiceExceptionReport version="1.1.1">
    <ServiceException>missing parameters ['version', 'layer', 'format']</ServiceException>
</ServiceExceptionReport>
`
  }
];

test('WMSErrorLoader#test cases', async (t) => {
  for (const tc of ERROR_TEST_CASES) {
    const error = (await parse(tc.xml, WMSErrorLoader, {wms: {minimalErrors: true}})) as string;
    t.equal(error, tc.parsed, `Error message: "${error}"`);
  }
  t.end();
});
