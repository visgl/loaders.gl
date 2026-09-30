// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import {
  ClusterSource,
  convertFeaturesToGeoArrowTable,
  convertGeoArrowGeometry
} from '@loaders.gl/geoarrow';
import type {ArrowTable, GeoJSONTable, Geometry} from '@loaders.gl/schema';
import type {GetFeaturesParameters} from '@loaders.gl/loader-utils';

const TABLE: GeoJSONTable = {
  shape: 'geojson-table',
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'first',
      properties: {value: 2},
      geometry: {type: 'Point', coordinates: [0, 0]}
    },
    // The shared table type omits GeoJSON's valid null geometry case.
    {type: 'Feature', id: 'empty', properties: {value: 100}, geometry: null as unknown as Geometry},
    {
      type: 'Feature',
      id: 'second',
      properties: {value: 3},
      geometry: {type: 'Point', coordinates: [0.01, 0]}
    },
    {
      type: 'Feature',
      id: 'line',
      properties: {value: 4},
      geometry: {
        type: 'LineString',
        coordinates: [
          [1, 0],
          [3, 0]
        ]
      }
    }
  ]
};
const REQUEST: GetFeaturesParameters = {
  layers: 'clusters',
  boundingBox: [
    [-180, -90],
    [180, 90]
  ],
  zoom: 0
};
let arrowTable: ArrowTable;
let source: ClusterSource;
beforeAll(() => {
  arrowTable = convertFeaturesToGeoArrowTable(TABLE.features);
  source = new ClusterSource(TABLE, {
    maxZoom: 2,
    aggregations: {total: {column: 'value', operation: 'sum'}}
  });
});

test('source keeps original feature identity and geometries while returning cluster markers', async () => {
  expect(source.indexedRowCount).toBe(2);
  const table = (await source.getFeatures({...REQUEST, format: 'geojson'})) as GeoJSONTable;
  expect(table.features[0].properties).toMatchObject({
    cluster: true,
    pointCount: 2,
    total: 5,
    rowIndex: null
  });
  const rows = source.index.getLeaves(table.features[0].id as number);
  expect(rows).toEqual([0, 2]);
  expect(rows.map(row => source.getFeature(row).id)).toEqual(['first', 'second']);
  expect(source.getFeature(3).geometry).toEqual(TABLE.features[3].geometry);
  expect(() => source.getFeature(-1)).toThrow();
  expect(() => source.getFeature(4)).toThrow();
  expect((await source.getMetadata()).layers[0].name).toBe('clusters');
});

test('GeoJSON, binary, WKB, native and union outputs agree and empty schemas retain fields', async () => {
  const table = (await source.getFeatures(REQUEST)) as ArrowTable;
  expect(table.data.getChild('pointCount')!.get(0)).toBe(2);
  expect(table.data.getChild('total')!.get(0)).toBe(5);
  expect(
    table.data.schema.fields
      .find(field => field.name === 'geometry')!
      .metadata.get('ARROW:extension:name')
  ).toBe('geoarrow.wkb');
  const binary = await source.getFeatures({...REQUEST, format: 'binary'});
  expect(binary.shape).toBe('binary-feature-collection');
  for (const preference of ['optimized', 'geoarrow.geometry'] as const) {
    const encoded = (await source.getFeatures({
      ...REQUEST,
      geoarrow: {encodingPreference: preference}
    })) as ArrowTable;
    expect(encoded.data.getChild('pointCount')!.get(0)).toBe(2);
    expect(
      encoded.data.schema.fields
        .find(field => field.name === 'geometry')!
        .metadata.get('ARROW:extension:name')
    ).toBe(preference === 'optimized' ? 'geoarrow.point' : 'geoarrow.geometry');
  }
  const empty = (await source.getFeatures({
    ...REQUEST,
    boundingBox: [
      [80, 30],
      [90, 40]
    ]
  })) as ArrowTable;
  expect(empty.data.numRows).toBe(0);
  expect(empty.data.schema.fields.map(field => field.name)).toEqual(
    table.data.schema.fields.map(field => field.name)
  );
  const schema = await source.getSchema();
  expect(schema.fields.map(field => field.name)).toEqual(
    table.data.schema.fields.map(field => field.name)
  );
  schema.fields.length = 0;
  expect((await source.getSchema()).fields.length).toBeGreaterThan(0);
});

test('Arrow geometry extraction handles mixed geometries, custom positions and aggregates', () => {
  const centroids = new ClusterSource(arrowTable, {
    positionStrategy: 'centroid',
    maxZoom: 1,
    aggregations: {maximum: {column: 'value', operation: 'max'}}
  });
  expect(centroids.indexedRowCount).toBe(3);
  expect(centroids.index.getNode(2).position).toEqual([2, 0]);
  expect(centroids.getFeature(3).geometry).toEqual(TABLE.features[3].geometry);
  expect(centroids.getFeature(3).properties!.value).toBe(4);
  const custom = new ClusterSource(TABLE, {
    getClusterPosition: (_geometry, rowIndex) => (rowIndex === 3 ? [42, 12] : null)
  });
  expect(custom.indexedRowCount).toBe(1);
  expect(custom.index.getNode(0)).toMatchObject({rowIndex: 3, position: [42, 12]});
});

test('native point input preserves null rows, chunk and slice offsets without feature objects', () => {
  const pointTable = convertFeaturesToGeoArrowTable(TABLE.features.slice(0, 3));
  const native = convertGeoArrowGeometry(pointTable.data, 'geoarrow.point');
  const chunked = native.concat(native).slice(1, 5);
  const points = new ClusterSource({shape: 'arrow-table', data: chunked});
  expect(points.indexedRowCount).toBe(2);
  expect(points.index.getNode(0).rowIndex).toBe(1);
  expect(points.index.getNode(1).rowIndex).toBe(2);
  expect(points.index.getNode(0).position).toEqual([0.01, 0]);
});

test('source rejects ambiguous columns, missing aggregates and reserved output names', () => {
  expect(() => new ClusterSource(arrowTable, {geometryColumn: 'missing'})).toThrow();
  expect(
    () => new ClusterSource(TABLE, {aggregations: {cluster: {column: 'value', operation: 'sum'}}})
  ).toThrow('Reserved');
  expect(
    () =>
      new ClusterSource(arrowTable, {aggregations: {total: {column: 'missing', operation: 'sum'}}})
  ).toThrow('finite numeric');
});

test('source requires zoom, validates layer/CRS and honors cancellation', async () => {
  await expect(source.getFeatures({...REQUEST, zoom: undefined})).rejects.toThrow('zoom');
  await expect(source.getFeatures({...REQUEST, layers: ['other']})).rejects.toThrow('clusters');
  await expect(source.getFeatures({...REQUEST, crs: 'EPSG:3857'})).rejects.toThrow(
    'longitude/latitude'
  );
  await expect(source.getFeatures({...REQUEST, requestCrs: 'EPSG:3857'})).rejects.toThrow(
    'longitude/latitude request bounds'
  );
  await expect(source.getFeatures({...REQUEST, signal: AbortSignal.abort()})).rejects.toThrow();
  expect((await source.getFeatures({...REQUEST, crs: 'EPSG:4326', format: 'geojson'})).shape).toBe(
    'geojson-table'
  );
  expect(
    (await source.getFeatures({...REQUEST, requestCrs: 'OGC:CRS84', format: 'geojson'})).shape
  ).toBe('geojson-table');
  const empty = new ClusterSource({
    shape: 'geojson-table',
    type: 'FeatureCollection',
    features: []
  });
  expect(empty.indexedRowCount).toBe(0);
  expect(((await empty.getFeatures(REQUEST)) as ArrowTable).data.numRows).toBe(0);
});
