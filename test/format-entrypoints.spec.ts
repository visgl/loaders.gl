// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GeoJSONLoader} from '@loaders.gl/tables/geojson';
import {GeoArrowLoader} from '@loaders.gl/tables/geoarrow';
import {JSONLoader} from '@loaders.gl/documents/json';
import * as kml from '@loaders.gl/geospatial/kml';
import * as wkb from '@loaders.gl/geospatial/wkb';
import * as wkt from '@loaders.gl/geospatial/wkt';
import {
  WKBLoader as BundledWKBLoader,
  HexWKBLoader as BundledHexWKBLoader,
  TWKBLoader as BundledTWKBLoader
} from '@loaders.gl/geospatial/wkb/bundled';
import {GPXLoader} from '@loaders.gl/geospatial/gpx';
import {TCXLoader} from '@loaders.gl/geospatial/tcx';
import {OMMLoader} from '@loaders.gl/geospatial/omm';
import {TLELoader} from '@loaders.gl/geospatial/tle';
import {NetCDFSource} from '@loaders.gl/scientific/netcdf';

test.each([
  GeoJSONLoader,
  GeoArrowLoader,
  JSONLoader,
  GPXLoader,
  TCXLoader,
  OMMLoader,
  TLELoader
])('$id format entrypoint exposes metadata and preloads its parser', async loader => {
  expect(loader).not.toHaveProperty('parse');
  const parserLoader = await loader.preload();
  expect(parserLoader.id).toBe(loader.id);
  expect(parserLoader).toHaveProperty('parse');
});

test('NetCDF source entrypoint exports the source class', () => {
  expect(NetCDFSource.name).toBe('NetCDFSource');
});

test('KML keeps other formats separate and marks low-level helpers experimental', () => {
  expect(kml).not.toHaveProperty('GPXLoader');
  expect(kml).not.toHaveProperty('TCXLoader');
  expect(kml).not.toHaveProperty('openKMZArchive');
  expect(kml).not.toHaveProperty('parseKMLDocument');
  expect(kml).not.toHaveProperty('resolveKMZResourcePath');
  expect(kml._openKMZArchive).toBeTypeOf('function');
  expect(kml._parseKMLDocument).toBeTypeOf('function');
  expect(kml._resolveKMZResourcePath).toBeTypeOf('function');
});

test('WKB format groups binary dialects and bundled parsers', () => {
  for (const [name, loader] of [
    ['WKBLoader', BundledWKBLoader],
    ['HexWKBLoader', BundledHexWKBLoader],
    ['TWKBLoader', BundledTWKBLoader]
  ] as const) {
    expect(wkb[name]).not.toHaveProperty('parse');
    expect(loader).toHaveProperty('parse');
    expect(loader.id).toBe(wkb[name].id);
    expect(wkt).not.toHaveProperty(name);
  }
  expect(wkb.WKBWriter).toHaveProperty('encodeSync');
});
