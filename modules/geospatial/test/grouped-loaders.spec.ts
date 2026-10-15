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
  DBFLoader,
  FlatGeobufLoader,
  GeoPackageLoader
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
import {FlatGeobufLoaderWithParser} from '@loaders.gl/geospatial/flatgeobuf';
import {FlatGeobufLoader as LegacyFlatGeobufLoader} from '@loaders.gl/flatgeobuf';
import {GeoPackageLoaderWithParser} from '@loaders.gl/geospatial/geopackage';
import {GeoPackageLoader as LegacyGeoPackageLoader} from '@loaders.gl/geopackage';

test.each([
  [GeoPackageLoader, GeoPackageLoaderWithParser],
  [FlatGeobufLoader, FlatGeobufLoaderWithParser],
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

test('legacy flatgeobuf metadata shares its grouped owner', () => {
  expect(LegacyFlatGeobufLoader).toBe(FlatGeobufLoader);
});

test('legacy geopackage metadata shares its grouped owner', () => {
  expect(LegacyGeoPackageLoader).toBe(GeoPackageLoader);
});

test('grouped source entry points preserve legacy source APIs', async () => {
  const [flatgeobuf, legacyFlatgeobuf, geopackage, legacyGeopackage] = await Promise.all([
    import('@loaders.gl/geospatial/flatgeobuf/flatgeobuf-source-loader'),
    import('@loaders.gl/flatgeobuf'),
    import('@loaders.gl/geospatial/geopackage/geopackage-source-loader'),
    import('@loaders.gl/geopackage')
  ]);
  expect(flatgeobuf.FlatGeobufSourceLoader).toBe(legacyFlatgeobuf.FlatGeobufSourceLoader);
  expect(flatgeobuf.FlatGeobufVectorSource).toBe(legacyFlatgeobuf.FlatGeobufVectorSource);
  expect(geopackage.GeoPackageSource).toBe(legacyGeopackage.GeoPackageSource);
  expect(geopackage.GeoPackageDataSource).toBe(legacyGeopackage.GeoPackageDataSource);
});
