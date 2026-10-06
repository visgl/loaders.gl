// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import type {Database} from 'sql.js';
import {
  getGeoPackageArrowSchema,
  getGeoPackageArrowTable,
  getGeoPackageGeoJSONTable,
  listGeoPackageVectorTables,
  selectGeoPackageVectorTable
} from '../src/lib/parse-geopackage';
import type {GeoPackageVectorTableInfo} from '../src/lib/types';

const VECTOR_TABLE: GeoPackageVectorTableInfo = {
  name: 'features',
  lastChange: '',
  geometryColumnName: 'geom',
  geometryTypeName: 'POINT',
  z: 0,
  m: 0
};
const PARSE_OPTIONS = {reproject: false, targetCrs: 'WGS84'} as const;

/** Creates an isolated SQL result boundary without loading SQL.js or its WASM asset. */
function createDatabase(
  columns: string[] = ['geom', 'name'],
  values: unknown[][] = [],
  pragmaRows: Record<string, unknown>[] = [
    {name: 'geom', type: 'POINT', notnull: 0, pk: 0},
    {name: 'name', type: 'TEXT', notnull: 0, pk: 0}
  ],
  dataColumns: Record<string, unknown>[] | Error = new Error('no such table: gpkg_data_columns')
): Database {
  return {
    exec: vi.fn(() => (values.length ? [{columns, values}] : [])),
    prepare: vi.fn((query: string) => {
      const isDataColumns = query.includes('gpkg_data_columns');
      if (isDataColumns && dataColumns instanceof Error) throw dataColumns;
      const rows = isDataColumns ? (dataColumns as Record<string, unknown>[]) : pragmaRows;
      let rowIndex = -1;
      return {
        bind: vi.fn(),
        step: () => ++rowIndex < rows.length,
        getAsObject: () => rows[rowIndex]
      };
    })
  } as unknown as Database;
}

/** Builds one point with the requested GeoPackage envelope and optional empty flag. */
function createPointBytes(envelopeLength = 0, empty = false): Uint8Array {
  const envelopeCode =
    envelopeLength === 32 ? 1 : envelopeLength === 48 ? 2 : envelopeLength === 64 ? 4 : 0;
  const bytes = new Uint8Array(8 + envelopeLength + 21);
  bytes.set([0x47, 0x50, 0, 1 | (envelopeCode << 1) | (empty ? 16 : 0)]);
  const geometry = new DataView(bytes.buffer, 8 + envelopeLength);
  geometry.setUint8(0, 1);
  geometry.setUint32(1, 1, true);
  geometry.setFloat64(5, 2, true);
  geometry.setFloat64(13, 3, true);
  return bytes;
}

test('GeoPackage geometry honors binary view ranges and every envelope length', () => {
  const point = createPointBytes();
  const padded = new Uint8Array(point.length + 4);
  padded.set(point, 2);
  const geometries = [
    point.buffer,
    padded.subarray(2, point.length + 2),
    new DataView(padded.buffer, 2, point.length),
    createPointBytes(32),
    createPointBytes(48),
    createPointBytes(64)
  ];
  const database = createDatabase(
    ['geom', 'name'],
    geometries.map((geometry, index) => [geometry, `point-${index}`])
  );
  const table = getGeoPackageGeoJSONTable(database, VECTOR_TABLE, {}, PARSE_OPTIONS);
  expect(table.features.map(feature => feature.geometry)).toEqual(
    geometries.map(() => ({type: 'Point', coordinates: [2, 3]}))
  );
  expect(table.features.map(feature => feature.id)).toEqual(geometries.map(() => undefined));
  expect(table.features[0].properties).toEqual({name: 'point-0'});
});

test('GeoPackage geometry distinguishes absent and explicitly empty binary values', () => {
  const database = createDatabase(
    ['geom', 'name'],
    [
      [null, 'absent'],
      [createPointBytes(0, true), 'empty']
    ]
  );
  const table = getGeoPackageGeoJSONTable(database, VECTOR_TABLE, {}, PARSE_OPTIONS);
  expect(table.features.map(feature => feature.geometry)).toEqual([null, null]);
  const arrowTable = getGeoPackageArrowTable(database, VECTOR_TABLE, {}, PARSE_OPTIONS);
  expect(arrowTable.data.numRows).toBe(2);
  expect(arrowTable.data.getChild('geometry')!.get(0)).toBeNull();
  expect(arrowTable.data.getChild('geometry')!.get(1)).toBeNull();
  const reprojected = getGeoPackageGeoJSONTable(
    database,
    {...VECTOR_TABLE, srsId: 4326},
    {4326: 'EPSG:4326'},
    {reproject: true, targetCrs: 'EPSG:4326'}
  );
  expect(reprojected.features.map(feature => feature.geometry)).toEqual([null, null]);
});

test.each([
  ['text', /geometry column to contain binary/],
  [new Uint8Array(3), /bounds|offset|outside|length/i],
  [new Uint8Array([0x47, 0x50, 0, 8]), /bounds|offset|outside|length/i]
])('GeoPackage rejects malformed binary input %#', (geometry, message) => {
  const database = createDatabase(['geom'], [[geometry]]);
  expect(() => getGeoPackageArrowTable(database, VECTOR_TABLE, {}, PARSE_OPTIONS)).toThrow(message);
});

test('GeoPackage data-column mappings preserve aliases and default names', () => {
  const database = createDatabase(
    ['geom', 'name', 'count'],
    [[createPointBytes(), 'mapped', 2]],
    [
      {name: 'geom', type: 'POINT'},
      {name: 'name', type: 'TEXT'},
      {name: 'count', type: 'INTEGER'}
    ],
    [
      {column_name: 'name', name: 'label'},
      {column_name: 'count', name: ''}
    ]
  );
  expect(
    getGeoPackageGeoJSONTable(database, VECTOR_TABLE, {}, PARSE_OPTIONS).features[0]
  ).toMatchObject({
    geometry: {type: 'Point', coordinates: [2, 3]},
    properties: {label: 'mapped', count: 2}
  });
  const invalidDatabase = createDatabase([], [], [], new Error('permission denied'));
  expect(() => getGeoPackageGeoJSONTable(invalidDatabase, VECTOR_TABLE, {}, PARSE_OPTIONS)).toThrow(
    'permission denied'
  );
});

test('GeoPackage empty feature results retain schema and tolerate missing type affinity', () => {
  const database = createDatabase(
    [],
    [],
    [
      {name: 'geom', type: 'POINT'},
      {name: 'untyped'},
      {name: 'custom', type: 'CUSTOM'},
      {name: 'count', type: 'integer', notnull: 1}
    ]
  );
  const table = getGeoPackageGeoJSONTable(database, VECTOR_TABLE, {}, PARSE_OPTIONS);
  expect(table.features).toEqual([]);
  expect(table.schema!.fields.map(field => [field.name, field.type, field.nullable])).toEqual([
    ['geom', 'binary', true],
    ['untyped', 'utf8', true],
    ['custom', 'utf8', true],
    ['count', 'int32', false]
  ]);
  expect(getGeoPackageArrowTable(database, VECTOR_TABLE, {}, PARSE_OPTIONS).data.numRows).toBe(0);
});

test('GeoPackage schemas preserve authority and object CRS metadata and unknown geometry types', () => {
  const database = createDatabase();
  const authority = getGeoPackageArrowSchema(database, {...VECTOR_TABLE, z: 1}, 'EPSG:4326');
  expect(JSON.parse(authority.fields.at(-1)!.metadata!['ARROW:extension:metadata'])).toEqual({
    crs: 'EPSG:4326',
    crs_type: 'authority_code'
  });
  expect(JSON.parse(authority.metadata.geo).columns.geometry.geometry_types).toEqual(['Point Z']);
  const definition = {type: 'GeographicCRS' as const, name: 'WGS84'};
  const objectSchema = getGeoPackageArrowSchema(database, VECTOR_TABLE, definition);
  expect(JSON.parse(objectSchema.fields.at(-1)!.metadata!['ARROW:extension:metadata'])).toEqual({
    crs: definition,
    crs_type: 'projjson'
  });
  const unknownSchema = getGeoPackageArrowSchema(database, {
    ...VECTOR_TABLE,
    geometryTypeName: 'UNKNOWN' as never
  });
  expect(JSON.parse(unknownSchema.metadata.geo).columns.geometry.geometry_types).toEqual([
    'Geometry'
  ]);
});

test('GeoPackage table discovery omits invalid optional metadata and selects fallback tables', () => {
  const database = createDatabase(
    [],
    [],
    [
      {
        table_name: 'features',
        identifier: '',
        description: 1,
        last_change: '',
        srs_id: NaN,
        column_name: 'geom',
        geometry_type_name: 'POINT',
        z: 0,
        m: 0,
        min_x: null,
        min_y: 0,
        max_x: 1,
        max_y: Infinity
      }
    ]
  );
  const tables = listGeoPackageVectorTables(database);
  expect(tables[0]).toMatchObject({
    identifier: undefined,
    description: undefined,
    srsId: undefined,
    bounds: undefined
  });
  expect(selectGeoPackageVectorTable(tables)).toBe(tables[0]);
  expect(selectGeoPackageVectorTable([VECTOR_TABLE, {...VECTOR_TABLE, name: 'other'}])).toBe(
    VECTOR_TABLE
  );
  expect(() => selectGeoPackageVectorTable([])).toThrow('no vector feature tables');
});
