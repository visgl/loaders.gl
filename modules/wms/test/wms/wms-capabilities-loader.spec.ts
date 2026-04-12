// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
// import {validateLoader} from 'test/common/conformance';

import {WMSCapabilitiesLoader} from '@loaders.gl/wms';
import {load} from '@loaders.gl/core';

const WMS_ANALYSES_URL = '@loaders.gl/wms/test/data/wms/get-capabilities/analyses.xml';
const WMS_DMSP_URL = '@loaders.gl/wms/test/data/wms/get-capabilities/dmsp.xml';
const WMS_FORECASTS_URL = '@loaders.gl/wms/test/data/wms/get-capabilities/forecasts.xml';
const WMS_OBS_URL = '@loaders.gl/wms/test/data/wms/get-capabilities/obs.xml';
const WMS_WWA_URL = '@loaders.gl/wms/test/data/wms/get-capabilities/wwa.xml';

const WMS_ADHOC_URL = '@loaders.gl/wms/test/data/wms/get-capabilities/?.xml';

test('WMSCapabilitiesLoader#forecasts.xml', async () => {
  const capabilities = await load(WMS_FORECASTS_URL, WMSCapabilitiesLoader);

  expect(typeof capabilities, 'parsed').toBe('object');
  expect(capabilities.version, 'version').toBe('1.1.1');
  expect(capabilities.layers[0].layers?.[2]?.name, 'contents').toBe('world_rivers');
});

test('WMSCapabilitiesLoader#obs.xml', async () => {
  const capabilities = await load(WMS_OBS_URL, WMSCapabilitiesLoader);

  expect(typeof capabilities, 'parsed').toBe('object');
  expect(capabilities.version, 'version').toBe('1.1.1');
  expect(capabilities.layers[0].layers?.[2]?.name, 'contents').toBe('world_rivers');
});

test('WMSCapabilitiesLoader#wwa.xml', async () => {
  const capabilities = await load(WMS_WWA_URL, WMSCapabilitiesLoader);

  expect(typeof capabilities, 'parsed').toBe('object');
  expect(capabilities.version, 'version').toBe('1.1.1');
  expect(capabilities.layers[0].layers?.[2]?.name, 'contents').toBe('world_rivers');
});

test('WMSCapabilitiesLoader#analyses.xml', async () => {
  const capabilities = await load(WMS_ANALYSES_URL, WMSCapabilitiesLoader);

  expect(typeof capabilities, 'parsed').toBe('object');
  expect(capabilities.version, 'version').toBe('1.1.1');
  expect(capabilities.layers[0].layers?.[2]?.name, 'contents').toBe('world_countries_label');
});

test('WMSCapabilitiesLoader#dmsp.xml', async () => {
  const capabilities = await load(WMS_DMSP_URL, WMSCapabilitiesLoader);

  expect(typeof capabilities, 'parsed').toBe('object');

  expect(capabilities.version, 'version').toBe('1.3.0');
  expect(capabilities.layers[0].layers?.[2]?.name, 'name').toBe('eez');
  expect(capabilities.layers[0].layers?.[2]?.opaque, 'opaque').toBe(false);
  expect(capabilities.layers[0].layers?.[2]?.queryable, 'queryable').toBe(false);
  expect(capabilities.layers[0].layers?.[2]?.cascaded, 'cascaded').toBe(false);
});

// For adhoc testing (non-committed XML files or direct from server)
test.skip('WMSCapabilitiesLoader#ad-hoc-test', async () => {
  const capabilities = await load(WMS_ADHOC_URL, WMSCapabilitiesLoader);

  expect(typeof capabilities, 'parsed').toBe('object');
  expect(capabilities.version, 'version').toBe('1.1.1');
  expect(capabilities.layers[0].layers?.[2]?.name, 'contents').toBe('eez');
});
