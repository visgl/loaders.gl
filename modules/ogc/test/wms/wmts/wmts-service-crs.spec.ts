// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, describe, expect, test} from 'vitest';
import {load} from '@loaders.gl/core';
import {WMTSCapabilitiesLoader, type WMTSCapabilities} from '@loaders.gl/ogc/wms';
import {WMTSImageTileSource} from '@loaders.gl/ogc/wms/bundled';

const WMTS_URL = 'https://example.com/wmts';
const CRS84_CAPABILITIES_URL = '@loaders.gl/ogc/wms/test/data/wmts/ogc-schema-example.xml';
const LAEA_CAPABILITIES_URL = '@loaders.gl/ogc/wms/test/data/wmts/epsg-3035-laea-europe.xml';

describe('WMTS CRS84 well-known scale set (OGC schema example)', () => {
  let capabilities: WMTSCapabilities;
  beforeAll(async () => {
    capabilities = (await load(CRS84_CAPABILITIES_URL, WMTSCapabilitiesLoader)) as WMTSCapabilities;
  });

  test('builds a complete degree grid from the CRS84 URN', async () => {
    const source = new WMTSImageTileSource(WMTS_URL, {
      wmts: {capabilities, layer: 'etopo2'}
    });
    const {tileGrid} = await source.getMetadata();
    expect(tileGrid?.crs).toBe('urn:ogc:def:crs:OGC:1.3:CRS84');
    expect(tileGrid?.origin).toEqual([-180, 90]);
    // Matrix 2g: 795139219.951954 * 0.00028 m / 111319.49 m per degree = 2.0 degrees per pixel.
    expect(tileGrid?.matrices?.[0].id).toBe('2g');
    expect(tileGrid?.matrices?.[0].resolution).toBeCloseTo(2, 6);
    expect(tileGrid?.matrices?.[1].resolution).toBeCloseTo(1, 6);
    expect(tileGrid?.tileMatrixSet).toBeDefined();
  });

  test.each([
    'CRS:84',
    'OGC:CRS84',
    'http://www.opengis.net/def/crs/OGC/1.3/CRS84'
  ])('selects the matrix set for crs %s', crs => {
    const source = new WMTSImageTileSource(WMTS_URL, {
      wmts: {capabilities, layer: 'etopo2', crs}
    });
    expect(source.getTileURL({x: 0, y: 0, z: 0})).toBe(
      'http://www.opengis.uab.es/SITiled/world/etopo2/default/WholeWorld_CRS_84/2g/0/0.png'
    );
  });
});

describe('WMTS northing-first CRS (EPSG:3035 LAEA Europe)', () => {
  let capabilities: WMTSCapabilities;
  beforeAll(async () => {
    capabilities = (await load(LAEA_CAPABILITIES_URL, WMTSCapabilitiesLoader)) as WMTSCapabilities;
  });

  test('swaps the N,E TopLeftCorner to an x,y origin', async () => {
    const source = new WMTSImageTileSource(WMTS_URL, {wmts: {capabilities}});
    const {tileGrid} = await source.getMetadata();
    expect(tileGrid?.crs).toBe('urn:ogc:def:crs:EPSG::3035');
    expect(tileGrid?.origin).toEqual([2000000, 5500000]);
    expect(tileGrid?.matrices?.[0].origin).toEqual([2000000, 5500000]);
    // EPSG:3035 has no built-in unit, so no resolution is guessed.
    expect(tileGrid?.matrices?.[0].resolution).toBeUndefined();
  });

  test('uses metersPerUnit for the resolution', async () => {
    const source = new WMTSImageTileSource(WMTS_URL, {
      wmts: {capabilities, crs: 'EPSG:3035', metersPerUnit: 1}
    });
    const {tileGrid} = await source.getMetadata();
    expect(tileGrid?.matrices?.[0].resolution).toBeCloseTo(4000, 6);
    expect(tileGrid?.matrices?.[1].resolution).toBeCloseTo(2000, 6);
    expect(source.getTileURL({x: 1, y: 2, z: 1})).toBe(
      'https://example.com/wmts/landcover/LAEA_Europe/1/2/1.png'
    );
  });

  test('axisOrder option overrides the built-in axis order', async () => {
    const source = new WMTSImageTileSource(WMTS_URL, {wmts: {capabilities, axisOrder: 'xy'}});
    const {tileGrid} = await source.getMetadata();
    expect(tileGrid?.origin).toEqual([5500000, 2000000]);
  });
});
