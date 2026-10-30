import {expect, test} from 'vitest';
// import {validateLoader} from 'test/common/conformance';
import {XMLLoader} from '@loaders.gl/documents';
import {load} from '@loaders.gl/core';
const FORECASTS_URL = '@loaders.gl/documents/test/xml/data/forecasts.xml';
test('XMLLoader#forecasts.xml', async () => {
  const json = await load(FORECASTS_URL, XMLLoader);
  expect(json, 'got result').toBeTruthy();
  expect(typeof json, 'parsed').toBe('object');
  expect(json.WMT_MS_Capabilities.Capability.Layer.Layer[2].Name, 'contents').toBe('world_rivers');
});
test('XMLLoader#internal parser#forecasts.xml', async () => {
  const json = await load(FORECASTS_URL, XMLLoader, {xml: {_parser: 'internal'}});
  expect(json, 'got result').toBeTruthy();
  expect(typeof json, 'parsed').toBe('object');
  expect(json.WMT_MS_Capabilities.Capability.Layer.Layer[2].Name, 'contents').toBe('world_rivers');
});
