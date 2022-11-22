// loaders.gl, MIT license

import test from 'tape-promise/tape';
// import {validateLoader} from 'test/common/conformance';

import {WMSCapabilitiesLoader} from '@loaders.gl/wms';
import {load} from '@loaders.gl/core';

const WMS_ANALYSES_URL = '@loaders.gl/wms/test/data/analyses.xml';
const WMS_DMSP_URL = '@loaders.gl/wms/test/data/dmsp.xml';
const WMS_FORECASTS_URL = '@loaders.gl/wms/test/data/forecasts.xml';
const WMS_OBS_URL = '@loaders.gl/wms/test/data/obs.xml';
const WMS_WWA_URL = '@loaders.gl/wms/test/data/wwa.xml';

test('WMSCapabilitiesLoader#forecasts.xml', async (t) => {
  const json = await load(WMS_FORECASTS_URL, WMSCapabilitiesLoader);

  t.ok(json, 'got result');
  t.equal(typeof json, 'object', 'parsed');
  t.equal(json.Capability.Layer.Layer[2].Name, 'world_rivers', 'contents');

  t.end();
});

test('WMSCapabilitiesLoader#obs.xml', async (t) => {
  const json = await load(WMS_OBS_URL, WMSCapabilitiesLoader);

  t.ok(json, 'got result');
  t.equal(typeof json, 'object', 'parsed');
  t.equal(json.Capability.Layer.Layer[2].Name, 'world_rivers', 'contents');
  t.end();
});

test('WMSCapabilitiesLoader#wwa.xml', async (t) => {
  const json = await load(WMS_WWA_URL, WMSCapabilitiesLoader);

  t.ok(json, 'got result');
  t.equal(typeof json, 'object', 'parsed');
  t.equal(json.Capability.Layer.Layer[2].Name, 'world_rivers', 'contents');

  t.end();
});

test('WMSCapabilitiesLoader#analyses.xml', async (t) => {
  const json = await load(WMS_ANALYSES_URL, WMSCapabilitiesLoader);

  t.ok(json, 'got result');
  t.equal(typeof json, 'object', 'parsed');
  t.equal(json.Capability.Layer.Layer[2].Name, 'world_countries_label', 'contents');

  t.end();
});

test('WMSCapabilitiesLoader#dmsp.xml', async (t) => {
  const json = await load(WMS_DMSP_URL, WMSCapabilitiesLoader);

  t.ok(json, 'got result');
  t.equal(typeof json, 'object', 'parsed');
  t.equal(json.Capability.Layer.Layer[2].Name, 'eez', 'contents');

  t.end();
});
