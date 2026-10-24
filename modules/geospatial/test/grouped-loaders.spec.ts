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
import {KMLLoaderWithParser} from '@loaders.gl/geospatial/kml/kml-loader';
import {KMZLoaderWithParser} from '@loaders.gl/geospatial/kmz';
import {GPXLoaderWithParser} from '@loaders.gl/geospatial/gpx';
import {TCXLoaderWithParser} from '@loaders.gl/geospatial/tcx';
import {ShapefileLoaderWithParser} from '@loaders.gl/geospatial/shapefile/shapefile-loader';
import {SHPLoaderWithParser} from '@loaders.gl/geospatial/shp';
import {DBFLoaderWithParser} from '@loaders.gl/geospatial/dbf';
import {KMLLoader as FormatKMLLoader} from '@loaders.gl/geospatial/kml';
import {ShapefileLoader as FormatShapefileLoader} from '@loaders.gl/geospatial/shapefile';
import {FlatGeobufLoaderWithParser} from '@loaders.gl/geospatial/flatgeobuf/flatgeobuf-loader';
import {FlatGeobufLoader as FormatFlatGeobufLoader} from '@loaders.gl/geospatial/flatgeobuf';
import {GeoPackageLoaderWithParser} from '@loaders.gl/geospatial/geopackage/geopackage-loader';
import {GeoPackageLoader as FormatGeoPackageLoader} from '@loaders.gl/geospatial/geopackage';

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

test('format geospatial roots share their implementation owner', () => {
  expect(FormatKMLLoader).toBe(KMLLoader);
  expect(FormatShapefileLoader).toBe(ShapefileLoader);
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

test('format flatgeobuf metadata shares its grouped owner', () => {
  expect(FormatFlatGeobufLoader).toBe(FlatGeobufLoader);
});

test('format geopackage metadata shares its grouped owner', () => {
  expect(FormatGeoPackageLoader).toBe(GeoPackageLoader);
});

test('grouped source entry points preserve format source APIs', async () => {
  const [flatgeobuf, formatFlatgeobuf, geopackage, formatGeopackage] = await Promise.all([
    import('@loaders.gl/geospatial/flatgeobuf/flatgeobuf-source-loader'),
    import('@loaders.gl/geospatial/flatgeobuf'),
    import('@loaders.gl/geospatial/geopackage/geopackage-source-loader'),
    import('@loaders.gl/geospatial/geopackage')
  ]);
  expect(flatgeobuf.FlatGeobufSourceLoader).toBe(formatFlatgeobuf.FlatGeobufSourceLoader);
  expect(flatgeobuf.FlatGeobufVectorSource).toBe(formatFlatgeobuf.FlatGeobufVectorSource);
  expect(geopackage.GeoPackageSource).toBe(formatGeopackage.GeoPackageSource);
  expect(geopackage.GeoPackageDataSource).toBe(formatGeopackage.GeoPackageDataSource);
});
