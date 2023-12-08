// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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
  },
  {
    parsed: 'Couche non disponible / Layer not available',
    xml: `\
"<?xml version='1.0' encoding="utf-8"?>
<ogc:ServiceExceptionReport version="1.3.0"
xmlns:ogc="http://www.opengis.net/ogc"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.opengis.net/ogc
http://schemas.opengis.net/wms/1.3.0/exceptions_1_3_0.xsd">
<ogc:ServiceException code="InvalidLayersParameter" locator="request">Couche non disponible / Layer not available</ogc:ServiceException>
</ogc:ServiceExceptionReport>"
`
  }
];

test('WMSErrorLoader#test cases', async (t) => {
  for (const tc of ERROR_TEST_CASES) {
    const error = (await parse(tc.xml, WMSErrorLoader, {wms: {minimalErrors: true}}));
    t.equal(error, tc.parsed, `Error message: "${error}"`);
  }
  t.end();
});
