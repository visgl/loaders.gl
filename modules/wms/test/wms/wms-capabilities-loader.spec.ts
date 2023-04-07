// loaders.gl, MIT license

import test from 'tape-promise/tape';
// import {validateLoader} from 'test/common/conformance';

import {WMSCapabilitiesLoader, WMSCapabilities} from '@loaders.gl/wms';
import {load} from '@loaders.gl/core';

const WMS_ANALYSES_URL = '@loaders.gl/wms/test/data/wms/get-capabilities/analyses.xml';
const WMS_DMSP_URL = '@loaders.gl/wms/test/data/wms/get-capabilities/dmsp.xml';
const WMS_FORECASTS_URL = '@loaders.gl/wms/test/data/wms/get-capabilities/forecasts.xml';
const WMS_OBS_URL = '@loaders.gl/wms/test/data/wms/get-capabilities/obs.xml';
const WMS_WWA_URL = '@loaders.gl/wms/test/data/wms/get-capabilities/wwa.xml';

const WMS_ADHOC_URL = '@loaders.gl/wms/test/data/wms/get-capabilities/?.xml';

test('WMSCapabilitiesLoader#forecasts.xml', async (t) => {
  const capabilities = (await load(WMS_FORECASTS_URL, WMSCapabilitiesLoader)) as WMSCapabilities;

  t.equal(typeof capabilities, 'object', 'parsed');
  t.equal(capabilities.layers[0].layers[2]?.name, 'world_rivers', 'contents');

  t.end();
});

test('WMSCapabilitiesLoader#obs.xml', async (t) => {
  const capabilities = (await load(WMS_OBS_URL, WMSCapabilitiesLoader)) as WMSCapabilities;

  t.equal(typeof capabilities, 'object', 'parsed');
  t.equal(capabilities.layers[0].layers[2].name, 'world_rivers', 'contents');
  t.end();
});

test('WMSCapabilitiesLoader#wwa.xml', async (t) => {
  const capabilities = (await load(WMS_WWA_URL, WMSCapabilitiesLoader)) as WMSCapabilities;

  t.equal(typeof capabilities, 'object', 'parsed');
  t.equal(capabilities.layers[0].layers[2].name, 'world_rivers', 'contents');

  t.end();
});

test('WMSCapabilitiesLoader#analyses.xml', async (t) => {
  const capabilities = (await load(WMS_ANALYSES_URL, WMSCapabilitiesLoader)) as WMSCapabilities;

  t.equal(typeof capabilities, 'object', 'parsed');
  t.equal(capabilities.layers[0].layers[2].name, 'world_countries_label', 'contents');

  t.end();
});

test('WMSCapabilitiesLoader#dmsp.xml', async (t) => {
  const capabilities = (await load(WMS_DMSP_URL, WMSCapabilitiesLoader)) as WMSCapabilities;

  t.equal(typeof capabilities, 'object', 'parsed');
  t.equal(capabilities.layers[0].layers[2].name, 'eez', 'contents');

  t.end();
});

// For adhoc testing (non-committed XML files or direct from server)
test.skip('WMSCapabilitiesLoader#ad-hoc-test', async (t) => {
  const capabilities = (await load(WMS_ADHOC_URL, WMSCapabilitiesLoader)) as WMSCapabilities;

  t.equal(typeof capabilities, 'object', 'parsed');
  t.equal(capabilities.layers[0].layers[2].name, 'eez', 'contents');

  t.end();
});
