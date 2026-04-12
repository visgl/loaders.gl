// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
// import {validateLoader} from 'test/common/conformance';

import {CSWCapabilitiesLoader} from '@loaders.gl/wms';
import {load} from '@loaders.gl/core';

const CSW_CAPABILITIES_URL = '@loaders.gl/wms/test/data/csw/get-capabilities.xml';

test('CSWCapabilitiesLoader#forecasts.xml', async () => {
  const capabilities = await load(CSW_CAPABILITIES_URL, CSWCapabilitiesLoader);
  // t.comment(JSON.stringify(capabilities));

  expect(typeof capabilities, 'parsed').toBe('object');
  // expect(capabilities.layer.layers[2]?.name, 'contents').toBe('world_rivers');

  
});
