// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {
  KMLLoader,
  KMZLoader,
  GPXLoader,
  TCXLoader,
  ShapefileLoader,
  SHPLoader,
  DBFLoader
} from '@loaders.gl/geospatial';
import {KMLLoaderWithParser} from '@loaders.gl/geospatial/kml';
import {KMZLoaderWithParser} from '@loaders.gl/geospatial/kmz';
import {GPXLoaderWithParser} from '@loaders.gl/geospatial/gpx';
import {TCXLoaderWithParser} from '@loaders.gl/geospatial/tcx';
import {ShapefileLoaderWithParser} from '@loaders.gl/geospatial/shapefile';
import {SHPLoaderWithParser} from '@loaders.gl/geospatial/shp';
import {DBFLoaderWithParser} from '@loaders.gl/geospatial/dbf';
import {KMLLoader as LegacyKMLLoader} from '@loaders.gl/kml';
import {ShapefileLoader as LegacyShapefileLoader} from '@loaders.gl/shapefile';

test.each([
  [KMLLoader, KMLLoaderWithParser],
  [KMZLoader, KMZLoaderWithParser],
  [GPXLoader, GPXLoaderWithParser],
  [TCXLoader, TCXLoaderWithParser],
  [ShapefileLoader, ShapefileLoaderWithParser],
  [SHPLoader, SHPLoaderWithParser],
  [DBFLoader, DBFLoaderWithParser]
])('geospatial metadata preloads the implementation for $0.id', async (metadata, implementation) => {
  expect(metadata).not.toHaveProperty('parse');
  expect(metadata).not.toHaveProperty('parseSync');
  expect(await metadata.preload!()).toBe(implementation);
  expect(implementation).not.toHaveProperty('preload');
  expect(implementation.module).toBe('geospatial');
});

test('legacy geospatial roots share their implementation owner', () => {
  expect(LegacyKMLLoader).toBe(KMLLoader);
  expect(LegacyShapefileLoader).toBe(ShapefileLoader);
});

test('core parses KML using group metadata', async () => {
  const text =
    '<kml xmlns="http://www.opengis.net/kml/2.2"><Placemark><name>A</name><Point><coordinates>1,2</coordinates></Point></Placemark></kml>';
  const result = await parse(new TextEncoder().encode(text).buffer, KMLLoader, {
    worker: false,
    kml: {shape: 'geojson-table'}
  });
  expect(result).toMatchObject({
    type: 'FeatureCollection',
    features: [{geometry: {type: 'Point', coordinates: [1, 2]}}]
  });
});
