// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {decodeTile} from '@maplibre/mlt';
import {encode} from '@loaders.gl/core';
import {convertFeaturesToGeoArrowTable} from '@loaders.gl/arrow-geometry/feature-table';
import type {Geometry} from '@loaders.gl/schema';
import {MLTWriter} from '../src';
import {MLTLoaderWithParser} from '../src/mlt-loader-with-parser';
import {encodeBooleanStream} from '../src/lib/encode-mlt-streams';

/** Builds tiny WKB tables with explicit scalar Arrow types and no geographic CRS declaration. */
function makeTable(geometries: (Geometry | null)[], columns: Record<string, arrow.Vector> = {}) {
  const table = convertFeaturesToGeoArrowTable(
    geometries.map(geometry => ({type: 'Feature', geometry, properties: {}})),
    {encodingPreference: 'geoarrow.wkb'}
  ).data;
  return new arrow.Table(
    new arrow.Schema(
      table.schema.fields.concat(
        Object.entries(columns).map(([name, vector]) => new arrow.Field(name, vector.type, true))
      )
    ),
    {geometry: table.getChild('geometry')!, ...columns}
  );
}

const POINT: Geometry = {type: 'Point', coordinates: [0.25, 0.5]};
const RING = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 0]
];
const HOLE = [
  [0.2, 0.2],
  [0.3, 0.2],
  [0.3, 0.3],
  [0.2, 0.2]
];

/** Uses the independent upstream decoder rather than the loaders.gl parser. */
function decode(data: ArrayBuffer) {
  return decodeTile(new Uint8Array(data), undefined, false)[0];
}

test('MLT public writer preserves nullable sliced dictionary attributes and safe numeric IDs', async () => {
  const input = makeTable([POINT, POINT, POINT, POINT], {
    name: arrow.vectorFromArray(
      ['unused', 'éast', null, ''],
      new arrow.Dictionary(new arrow.Utf8(), new arrow.Int32())
    ),
    value: arrow.vectorFromArray([0, 1.25, null, -4], new arrow.Float64()),
    id: arrow.vectorFromArray([0n, BigInt(Number.MAX_SAFE_INTEGER), null, 0n], new arrow.Int64()),
    enabled: arrow.vectorFromArray([true, false, null, true], new arrow.Bool()),
    empty: arrow.vectorFromArray([null, null, null, null], new arrow.Null())
  });
  const table = input.slice(1, 2).concat(input.slice(2));
  const bytes = await encode(table, MLTWriter, {mlt: {layerName: 'points', idColumn: 'id'}});
  const layer = decode(bytes);
  expect(layer.name).toBe('points');
  expect(layer.extent).toBe(4096);
  const features = layer.getFeatures();
  expect(features.map(feature => feature.id)).toEqual([BigInt(Number.MAX_SAFE_INTEGER), null, 0n]);
  const parsed = MLTLoaderWithParser.parseSync(bytes, {mlt: {shape: 'geojson-table'}});
  if (!('features' in parsed)) throw new Error('Expected GeoJSON output');
  expect(parsed.features.map(feature => feature.id)).toEqual([
    Number.MAX_SAFE_INTEGER,
    undefined,
    0
  ]);
  expect(features[0].properties).toEqual({
    name: 'éast',
    value: 1.25,
    id: Number.MAX_SAFE_INTEGER,
    enabled: false
  });
  expect(features[1].properties).toEqual({});
  expect(layer.getPropertyVector('empty').getValue(0)).toBeNull();
  expect(layer.getPropertyVector('name').getValue(1)).toBeNull();
  expect(features[2].properties).toMatchObject({name: '', value: -4, enabled: true});
  expect(features[0].geometry.coordinates[0][0]).toMatchObject({x: 1024, y: 2048});
  expect(await encode(table, MLTWriter, {mlt: {layerName: 'points', idColumn: 'id'}})).toEqual(
    bytes
  );
});

const GEOMETRIES: Geometry[] = [
  POINT,
  {
    type: 'LineString',
    coordinates: [
      [0, 0],
      [0.5, 0.5]
    ]
  },
  {type: 'Polygon', coordinates: [RING, HOLE]},
  {
    type: 'MultiPoint',
    coordinates: [
      [0, 0],
      [1, 1]
    ]
  },
  {
    type: 'MultiLineString',
    coordinates: [
      [
        [0, 0],
        [1, 1]
      ],
      [
        [0, 1],
        [1, 0]
      ]
    ]
  },
  {type: 'MultiPolygon', coordinates: [[RING, HOLE], [RING]]}
];

test.each(GEOMETRIES)('MLT encodes homogeneous $type topology', geometry => {
  const layer = decode(MLTWriter.encodeSync(makeTable([geometry, geometry])));
  expect(layer.numFeatures).toBe(2);
  expect(layer.getFeatures().map(feature => feature.geometry.type)).toEqual([
    GEOMETRIES.indexOf(geometry),
    GEOMETRIES.indexOf(geometry)
  ]);
  expect(layer.geometryVector.getGeometries()[0].length).toBe(
    geometry.type === 'Polygon'
      ? 2
      : geometry.type === 'MultiPolygon'
        ? 3
        : geometry.type.startsWith('Multi')
          ? 2
          : 1
  );
});

test('MLT mixed topology keeps multipolygon hole ownership in upstream topology offsets', () => {
  const layer = decode(MLTWriter.encodeSync(makeTable(GEOMETRIES)));
  expect(layer.getFeatures().map(feature => feature.geometry.type)).toEqual([0, 1, 2, 3, 4, 5]);
  // The upstream convenience geometry accessor flattens multipolygon rings; its topology retains ownership.
  expect(Array.from(layer.geometryVector.topologyVector!.geometryOffsets!)).toEqual([
    0, 1, 2, 3, 5, 7, 9
  ]);
  expect(layer.geometryVector.getGeometries()[2]).toHaveLength(2);
  expect(layer.geometryVector.getGeometries()[5]).toHaveLength(3);
});

test('MLT omits null and collapsed geometry and retains clipped buffer coordinates', () => {
  const table = makeTable([
    null,
    {
      type: 'LineString',
      coordinates: [
        [0, 0],
        [0, 0]
      ]
    },
    {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [0, 0],
          [0, 0]
        ]
      ]
    },
    {type: 'Point', coordinates: [-1, 5000]}
  ]);
  const layer = decode(
    MLTWriter.encodeSync(table, {mlt: {coordinates: 'tile', extent: 8192, propertyColumns: []}})
  );
  expect(layer.numFeatures).toBe(1);
  expect(layer.getFeatures()[0].geometry.coordinates[0][0]).toMatchObject({x: -1, y: 5000});
  expect(MLTWriter.encodeSync(makeTable([null])).byteLength).toBe(0);
});

test.each([
  {extent: 0},
  {coordinates: 'wgs84'},
  {layerName: ''},
  {maxFeatures: 0},
  {geometryColumn: 'missing'},
  {propertyColumns: ['missing']},
  {propertyColumns: ['geometry']},
  {propertyColumns: ['value', 'value']},
  {idColumn: 'missing'}
])('MLT rejects invalid configuration %j', configuration => {
  expect(() => MLTWriter.encodeSync(makeTable([POINT]), {mlt: configuration as any})).toThrow();
});

test.each([
  Number.NaN,
  Number.POSITIVE_INFINITY,
  Number.MAX_SAFE_INTEGER + 1,
  9007199254740992n
])('MLT rejects unsafe attribute %s', value => {
  const vector =
    typeof value === 'bigint'
      ? arrow.vectorFromArray([value], new arrow.Int64())
      : arrow.vectorFromArray([value], new arrow.Float64());
  expect(() => MLTWriter.encodeSync(makeTable([POINT], {value: vector}))).toThrow(
    /unsafe|safe integer/
  );
});

test.each([-1, 0.5])('MLT rejects invalid feature ID %s', value => {
  expect(() =>
    MLTWriter.encodeSync(makeTable([POINT], {id: arrow.vectorFromArray([value])}), {
      mlt: {idColumn: 'id'}
    })
  ).toThrow(/IDs/);
});

test('MLT rejects geographic CRS, nested attributes and non-XY geometry explicitly', () => {
  const geographic = convertFeaturesToGeoArrowTable(
    [{type: 'Feature', geometry: POINT, properties: {}}],
    {encodingPreference: 'geoarrow.wkb'}
  );
  geographic.data.schema.fields[0].metadata.set(
    'ARROW:extension:metadata',
    JSON.stringify({crs: 'OGC:CRS84'})
  );
  expect(() => MLTWriter.encodeSync(geographic)).toThrow(/tile-local/);
  expect(() =>
    MLTWriter.encodeSync(makeTable([POINT], {nested: arrow.vectorFromArray([[1, 2]])}))
  ).toThrow(/attribute type/);
  expect(() => MLTWriter.encodeSync(makeTable([{type: 'Point', coordinates: [0, 0, 1]}]))).toThrow(
    /XY/
  );
});

test('boolean packing spans ORC literal runs without stack-sized spreads', () => {
  const count = 1033;
  const table = makeTable(
    Array.from({length: count}, () => POINT),
    {
      flag: arrow.vectorFromArray(
        Array.from({length: count}, (_, index) => index % 3 === 0),
        new arrow.Bool()
      )
    }
  );
  expect(
    decode(MLTWriter.encodeSync(table))
      .getFeatures()
      .map(feature => feature.properties.flag)
  ).toEqual(Array.from({length: count}, (_, index) => index % 3 === 0));
  expect(encodeBooleanStream(0, []).length).toBe(4);
});
