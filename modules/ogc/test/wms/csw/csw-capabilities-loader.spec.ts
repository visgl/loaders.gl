// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
// import {validateLoader} from 'test/common/conformance';
import {CSWCapabilitiesLoader} from '@loaders.gl/ogc/wms';
import {load} from '@loaders.gl/core';
const CSW_CAPABILITIES_URL = '@loaders.gl/ogc/wms/test/data/csw/get-capabilities.xml';
test('CSWCapabilitiesLoader#forecasts.xml', async () => {
  const capabilities = await load(CSW_CAPABILITIES_URL, CSWCapabilitiesLoader);
  // t.comment(JSON.stringify(capabilities));
  expect(typeof capabilities, 'parsed').toBe('object');
});
