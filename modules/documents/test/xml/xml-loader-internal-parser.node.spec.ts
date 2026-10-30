import {expect, test} from 'vitest';
import {readFile} from 'node:fs/promises';
import {XMLLoaderWithParser as XMLLoader} from '@loaders.gl/documents/xml-loader';
const FORECASTS_URL = new URL('./data/forecasts.xml', import.meta.url);
test('XMLLoader#internal parser#forecasts.xml (NODE)', async () => {
  const text = await readFile(FORECASTS_URL, 'utf8');
  const json = XMLLoader.parseTextSync?.(text, {xml: {_parser: 'internal'}});
  expect(json, 'got result').toBeTruthy();
  expect(typeof json, 'parsed').toBe('object');
  expect(json.WMT_MS_Capabilities.Capability.Layer.Layer[2].Name, 'contents').toBe('world_rivers');
});
