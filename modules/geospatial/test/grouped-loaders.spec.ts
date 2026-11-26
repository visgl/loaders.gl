// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {KMLLoader, KMZLoader} from '@loaders.gl/geospatial/kml';
import {GPXLoader} from '@loaders.gl/geospatial/gpx';
import {TCXLoader} from '@loaders.gl/geospatial/tcx';
import {OMMLoader} from '@loaders.gl/scientific/omm';
import {TLELoader} from '@loaders.gl/scientific/tle';
import {ShapefileLoader} from '@loaders.gl/geospatial/shapefile';
import {SHPLoader} from '@loaders.gl/geospatial/shp';
import {DBFLoader} from '@loaders.gl/geospatial/dbf';
import {FlatGeobufLoader} from '@loaders.gl/geospatial/flatgeobuf';
import {GeoPackageLoader} from '@loaders.gl/geospatial/geopackage';
import {KMLLoaderWithParser} from '@loaders.gl/geospatial/kml/bundled';
import {KMZLoaderWithParser} from '@loaders.gl/geospatial/kmz/bundled';
import {GPXLoaderWithParser} from '@loaders.gl/geospatial/gpx/bundled';
import {TCXLoaderWithParser} from '@loaders.gl/geospatial/tcx/bundled';
import {ShapefileLoaderWithParser} from '@loaders.gl/geospatial/shapefile/bundled';
import {SHPLoaderWithParser} from '@loaders.gl/geospatial/shp/bundled';
import {DBFLoaderWithParser} from '@loaders.gl/geospatial/dbf/bundled';
import {OMMLoaderWithParser} from '@loaders.gl/scientific/omm/bundled';
import {TLELoaderWithParser} from '@loaders.gl/scientific/tle/bundled';
import {KMLLoader as FormatKMLLoader} from '@loaders.gl/geospatial/kml';
import {ShapefileLoader as FormatShapefileLoader} from '@loaders.gl/geospatial/shapefile';
import {FlatGeobufLoaderWithParser} from '@loaders.gl/geospatial/flatgeobuf/bundled';
import {FlatGeobufLoader as FormatFlatGeobufLoader} from '@loaders.gl/geospatial/flatgeobuf';
import {GeoPackageLoaderWithParser} from '@loaders.gl/geospatial/geopackage/bundled';
import {GeoPackageLoader as FormatGeoPackageLoader} from '@loaders.gl/geospatial/geopackage';

test.each([
  [GeoPackageLoader, GeoPackageLoaderWithParser],
  [FlatGeobufLoader, FlatGeobufLoaderWithParser],
  [KMLLoader, KMLLoaderWithParser],
  [KMZLoader, KMZLoaderWithParser],
  [GPXLoader, GPXLoaderWithParser],
  [TCXLoader, TCXLoaderWithParser],
  [OMMLoader, OMMLoaderWithParser],
  [TLELoader, TLELoaderWithParser],
  [ShapefileLoader, ShapefileLoaderWithParser],
  [SHPLoader, SHPLoaderWithParser],
  [DBFLoader, DBFLoaderWithParser]
])('geospatial metadata preloads the implementation for $0.id', async (metadata, implementation) => {
  expect(metadata).not.toHaveProperty('parse');
  expect(metadata).not.toHaveProperty('parseSync');
  expect(await metadata.preload!()).toBe(implementation);
  expect(implementation).not.toHaveProperty('preload');
  expect(implementation.module).toBe(metadata.module);
});

test('format geospatial roots share their implementation owner', () => {
  expect(FormatKMLLoader).toBe(KMLLoader);
  expect(FormatShapefileLoader).toBe(ShapefileLoader);
});

test('core parses KML using group metadata', async () => {
  const text =
    '<kml xmlns="http://www.opengis.net/kml/2.2"><Placemark><name>A</name><Point><coordinates>1,2</coordinates></Point></Placemark></kml>';
  const result = await parse(new TextEncoder().encode(text).buffer, KMLLoader, {
    core: {worker: false},
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
    import('@loaders.gl/geospatial/flatgeobuf'),
    import('@loaders.gl/geospatial/flatgeobuf'),
    import('@loaders.gl/geospatial/geopackage'),
    import('@loaders.gl/geospatial/geopackage')
  ]);
  expect(flatgeobuf.FlatGeobufVectorSource).toBe(formatFlatgeobuf.FlatGeobufVectorSource);
  expect(geopackage.GeoPackageDataSource).toBe(formatGeopackage.GeoPackageDataSource);
});
