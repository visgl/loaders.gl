// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
// import {validateLoader} from 'test/common/conformance';
import {WMSCapabilitiesLoader} from '@loaders.gl/ogc/wms';
import {load} from '@loaders.gl/core';
const WMS_ANALYSES_URL = '@loaders.gl/ogc/wms/test/data/wms/get-capabilities/analyses.xml';
const WMS_DMSP_URL = '@loaders.gl/ogc/wms/test/data/wms/get-capabilities/dmsp.xml';
const WMS_FORECASTS_URL = '@loaders.gl/ogc/wms/test/data/wms/get-capabilities/forecasts.xml';
const WMS_OBS_URL = '@loaders.gl/ogc/wms/test/data/wms/get-capabilities/obs.xml';
const WMS_WWA_URL = '@loaders.gl/ogc/wms/test/data/wms/get-capabilities/wwa.xml';
const WMS_ADHOC_URL = '@loaders.gl/ogc/wms/test/data/wms/get-capabilities/?.xml';
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

test('WMSCapabilitiesLoader#inherited-crs.xml merges parent and child CRS lists', async () => {
  const capabilities = await load(
    '@loaders.gl/ogc/wms/test/data/wms/get-capabilities/inherited-crs.xml',
    WMSCapabilitiesLoader,
    {wms: {inheritedLayerProps: true}}
  );
  const [root] = capabilities.layers;
  const [parcels, roads] = root.layers || [];
  expect(root.crs).toEqual(['EPSG:4326', 'EPSG:3857']);
  // WMS 1.3.0 Table 7: a child inherits the parent CRS list and can add more. No duplicates.
  expect(parcels.crs).toEqual(['EPSG:4326', 'EPSG:3857', 'EPSG:25832']);
  expect(roads.crs).toEqual(['EPSG:4326', 'EPSG:3857']);
  // A child BoundingBox replaces the parent BoundingBox for the same CRS only.
  expect(parcels.boundingBoxes?.map(boundingBox => boundingBox.crs)).toEqual([
    'EPSG:4326',
    'EPSG:3857',
    'EPSG:25832'
  ]);
  expect(
    parcels.boundingBoxes?.find(boundingBox => boundingBox.crs === 'EPSG:3857')?.boundingBox
  ).toEqual([
    [600000, 6000000],
    [1600000, 7300000]
  ]);
  expect(roads.boundingBoxes?.map(boundingBox => boundingBox.crs)).toEqual([
    'EPSG:4326',
    'EPSG:3857'
  ]);
});

test('WMSCapabilitiesLoader#inherited-crs.xml compares CRS spellings when it merges', async () => {
  const capabilities = await load(
    '@loaders.gl/ogc/wms/test/data/wms/get-capabilities/inherited-crs.xml',
    WMSCapabilitiesLoader,
    {wms: {inheritedLayerProps: true}}
  );
  const maps = capabilities.layers[0].layers?.[2];
  // The child spells EPSG:3857 as a URN. It is the same CRS, so it is not added again.
  expect(maps?.crs).toEqual(['EPSG:4326', 'EPSG:3857', 'EPSG:3035']);
  expect(maps?.boundingBoxes?.map(boundingBox => boundingBox.crs)).toEqual([
    'EPSG:4326',
    'urn:ogc:def:crs:EPSG::3857'
  ]);
});
