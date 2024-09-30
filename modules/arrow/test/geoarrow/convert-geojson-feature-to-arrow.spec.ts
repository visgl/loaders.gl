// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {Schema as ArrowSchema, Table as ArrowTable} from 'apache-arrow';
import {
  parseGeometryFromArrow,
  geojsonPointToArrow,
  geojsonMultiPointToArrow,
  geojsonMultiPolygonToArrow
} from '@loaders.gl/arrow';

import {
  expectedPointGeojson,
  expectedMultiPointGeoJson,
  expectedMultiPolygonGeojson
} from '../data/geoarrow/test-cases';

test('ArrowUtils#geojsonPointToArrow', async (t) => {
  const points = expectedPointGeojson.features;
  const geomFieldName = 'geometry';
  const {field, geometry} = geojsonPointToArrow(geomFieldName, points);
  const schema = new ArrowSchema([field]);
  // @ts-ignore
  const table = new ArrowTable(schema, {geometry});

  const firstArrowGeometry = table.getChild('geometry')?.get(0);
  const encoding = 'geoarrow.point';

  const firstGeometry = parseGeometryFromArrow(firstArrowGeometry, encoding);
  t.deepEqual(firstGeometry, points[0].geometry, 'GeoJSON Geometry is correct');
  t.end();
});

test('ArrowUtils#geojsonMultiPointToArrow', async (t) => {
  const points = expectedMultiPointGeoJson.features;
  const geomFieldName = 'geometry';
  const {field, geometry} = geojsonMultiPointToArrow(geomFieldName, points);

  const schema = new ArrowSchema([field]);
  // @ts-ignore
  const table = new ArrowTable(schema, {geometry});

  const firstArrowGeometry = table.getChild('geometry')?.get(0);
  const encoding = 'geoarrow.multipoint';

  const firstGeometry = parseGeometryFromArrow(firstArrowGeometry, encoding);
  t.deepEqual(firstGeometry, points[0].geometry, 'GeoJSON Geometry is correct');
  t.end();
});

test('ArrowUtils#geojsonMultiPolygon', async (t) => {
  const points = expectedMultiPolygonGeojson.features;
  const geomFieldName = 'geometry';
  const {field, geometry} = geojsonMultiPolygonToArrow(geomFieldName, points);

  const schema = new ArrowSchema([field]);
  // @ts-ignore
  const table = new ArrowTable(schema, {geometry});

  const firstArrowGeometry = table.getChild('geometry')?.get(0);
  const encoding = 'geoarrow.multipolygon';

  const firstGeometry = parseGeometryFromArrow(firstArrowGeometry, encoding);
  t.deepEqual(firstGeometry, points[0].geometry, 'GeoJSON Geometry is correct');
  t.end();
});
