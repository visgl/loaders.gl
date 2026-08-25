// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {encode, load} from '@loaders.gl/core';
import {encodeWKBGeometryValue} from '@loaders.gl/gis';
import type {ObjectRowTable} from '@loaders.gl/schema';
import {
  ParquetJSWriter,
  ParquetSourceLoader,
  type ParquetSourceBatch,
  type ParquetSourceMetadata
} from '@loaders.gl/parquet';
import type {ParquetSource} from '@loaders.gl/parquet/parquet-source-loader';

import {
  BoundingBox,
  ColumnMetaData,
  CompressionCodec,
  Encoding,
  GeospatialStatistics,
  Type
} from '../src/parquetjs/parquet-thrift/index';
import {serializeThrift} from '../src/parquetjs/utils/read-utils';
import {Uint8ArrayCompactProtocol} from '../src/parquetjs/utils/uint8-array-compact-protocol';
import {Uint8ArrayTransport} from '../src/parquetjs/utils/uint8-array-transport';

test('Parquet native geospatial statistics round-trip all dimensions and geometry types', () => {
  const columnMetadata = new ColumnMetaData({
    type: Type.BYTE_ARRAY,
    path_in_schema: ['geometry'],
    codec: CompressionCodec.UNCOMPRESSED,
    encodings: [Encoding.PLAIN],
    num_values: 4,
    total_uncompressed_size: 100,
    total_compressed_size: 100,
    data_page_offset: 0,
    geospatial_statistics: new GeospatialStatistics({
      bbox: new BoundingBox({
        xmin: 170,
        xmax: -170,
        ymin: -45,
        ymax: 45,
        zmin: -100,
        zmax: 500,
        mmin: 0,
        mmax: 60
      }),
      geospatial_types: [1, 1002, 2003, 3007]
    })
  });
  const protocol = new Uint8ArrayCompactProtocol(
    new Uint8ArrayTransport(serializeThrift(columnMetadata))
  );
  const decoded = ColumnMetaData.read(protocol);

  expect(decoded.geospatial_statistics?.bbox).toEqual({
    xmin: 170,
    xmax: -170,
    ymin: -45,
    ymax: 45,
    zmin: -100,
    zmax: 500,
    mmin: 0,
    mmax: 60
  });
  expect(decoded.geospatial_statistics?.geospatial_types).toEqual([1, 1002, 2003, 3007]);
});

test('ParquetSourceLoader reads the canonical GeoParquet 2.0 interoperability fixture', async () => {
  const source = (await load(
    '@loaders.gl/parquet/test/data/geoparquet/example-2.0.parquet',
    ParquetSourceLoader,
    {core: {worker: false}}
  )) as ParquetSource;
  const metadata = await source.getMetadata({formatSpecificMetadata: true});
  const geometrySchemaElement = metadata.formatSpecificMetadata?.schema.find(
    schemaElement => schemaElement.name === 'geometry'
  );

  expect(geometrySchemaElement?.logicalType?.GEOMETRY).toBeDefined();
  expect(geometrySchemaElement?.logicalType?.GEOMETRY?.crs).toBeUndefined();
  const geoMetadata = JSON.parse(metadata.keyValueMetadata.geo);
  expect(geoMetadata.version).toBe('2.0.0');
  expect(geoMetadata.columns.geometry.geometry_types).toEqual(['Polygon', 'MultiPolygon']);
  const geometryColumn = metadata.rowGroups[0].columns.find(column => column.path[0] === 'geometry');
  expect(geometryColumn?.geospatialStatistics).toEqual({
    bbox: {xmin: -180, xmax: 180, ymin: -18.28799, ymax: 83.23324000000001},
    geometryTypes: [3, 6]
  });
});

test('ParquetJSWriter emits GeoParquet 2.0 logical types and row-group statistics', async () => {
  const firstGeometry = encodeWKBGeometryValue({
    type: 'LineString',
    coordinates: [
      [-10, 2, -5, 100],
      [20, 30, 8, 50]
    ]
  })!;
  const secondGeometry = encodeWKBGeometryValue({type: 'Point', coordinates: [100, -20]})!;
  const table: ObjectRowTable = {
    shape: 'object-row-table',
    schema: {
      fields: [
        {
          name: 'geometry',
          type: 'binary',
          nullable: false,
          metadata: {'ARROW:extension:name': 'geoarrow.wkb'}
        }
      ],
      metadata: {
        geo: JSON.stringify({
          version: '2.0.0',
          primary_column: 'geometry',
          columns: {
            geometry: {
              encoding: 'WKB',
              geometry_types: ['LineString ZM', 'Point'],
              edges: 'karney',
              crs: {id: {authority: 'OGC', code: 'CRS84'}}
            }
          }
        })
      }
    },
    data: [{geometry: firstGeometry}, {geometry: secondGeometry}]
  };
  const parquetBuffer = await encode(table, ParquetJSWriter, {
    parquet: {rowGroupSize: 1},
    worker: false
  });
  const source = (await load(new Blob([parquetBuffer]), ParquetSourceLoader, {
    core: {worker: false}
  })) as ParquetSource;
  const metadata = (await source.getMetadata({
    formatSpecificMetadata: true
  })) as ParquetSourceMetadata;

  expect(metadata.rowGroups.map(rowGroup => rowGroup.columns[0].geospatialStatistics)).toEqual([
    {
      bbox: undefined,
      geometryTypes: [3002]
    },
    {
      bbox: undefined,
      geometryTypes: [1]
    }
  ]);
  const geometrySchemaElement = metadata.formatSpecificMetadata?.schema.find(
    schemaElement => schemaElement.name === 'geometry'
  );
  expect(geometrySchemaElement?.logicalType?.GEOGRAPHY?.algorithm).toBe(4);
  expect(JSON.parse(geometrySchemaElement?.logicalType?.GEOGRAPHY?.crs || '{}')).toEqual({
    id: {authority: 'OGC', code: 'CRS84'}
  });

  const batches = await collectBatches(source.read({bbox: [-11, 1, 21, 31]}));
  expect(batches.map(batch => batch.rowGroupIndex)).toEqual([0, 1]);
  expect(source.getTelemetry().rowGroupsPrunedByStatistics).toBe(0);
});

test('ParquetJSWriter emits native Parquet geo types directly from GeoArrow WKB metadata', async () => {
  const table: ObjectRowTable = {
    shape: 'object-row-table',
    schema: {
      fields: [
        {
          name: 'geometry',
          type: 'binary',
          nullable: false,
          metadata: {
            'ARROW:extension:name': 'geoarrow.wkb',
            'ARROW:extension:metadata': JSON.stringify({edges: 'vincenty'})
          }
        }
      ],
      metadata: {}
    },
    data: [{geometry: encodeWKBGeometryValue({type: 'Point', coordinates: [1, 2]})!}]
  };
  const parquetBuffer = await encode(table, ParquetJSWriter, {worker: false});
  const source = (await load(new Blob([parquetBuffer]), ParquetSourceLoader, {
    core: {worker: false}
  })) as ParquetSource;
  const metadata = await source.getMetadata({formatSpecificMetadata: true});
  const geometrySchemaElement = metadata.formatSpecificMetadata?.schema.find(
    schemaElement => schemaElement.name === 'geometry'
  );

  expect(geometrySchemaElement?.logicalType?.GEOGRAPHY?.algorithm).toBe(1);
  expect(geometrySchemaElement?.logicalType?.GEOGRAPHY?.crs).toBe('srid:0');
  expect(metadata.rowGroups[0].columns[0].geospatialStatistics).toEqual({
    bbox: undefined,
    geometryTypes: [1]
  });
});

test('ParquetJSWriter ignores nulls and omits bounds for empty native geometries', async () => {
  const table = createGeoArrowWKBTable(undefined, [
    null,
    encodeWKBGeometryValue({type: 'LineString', coordinates: []})!
  ]);
  const parquetBuffer = await encode(table, ParquetJSWriter, {worker: false});
  const source = (await load(new Blob([parquetBuffer]), ParquetSourceLoader, {
    core: {worker: false}
  })) as ParquetSource;
  const metadata = await source.getMetadata({formatSpecificMetadata: true});
  const geometrySchemaElement = metadata.formatSpecificMetadata?.schema.find(
    schemaElement => schemaElement.name === 'geometry'
  );

  expect(geometrySchemaElement?.logicalType?.GEOMETRY?.crs).toBe('srid:0');
  expect(metadata.rowGroups[0].columns[0].geospatialStatistics).toEqual({
    bbox: undefined,
    geometryTypes: [2]
  });
});

test('ParquetJSWriter rejects malformed GeoArrow WKB semantics', async () => {
  await expect(
    encode(createGeoArrowWKBTable('{invalid json', []), ParquetJSWriter, {worker: false})
  ).rejects.toThrow(/Invalid GeoArrow metadata/);
  await expect(
    encode(
      createGeoArrowWKBTable(JSON.stringify({crs: null}), []),
      ParquetJSWriter,
      {worker: false}
    )
  ).rejects.toThrow(/Invalid GeoArrow CRS/);
  await expect(
    encode(
      createGeoArrowWKBTable(JSON.stringify({edges: 'rhumb'}), []),
      ParquetJSWriter,
      {worker: false}
    )
  ).rejects.toThrow(/Invalid GeoArrow edges/);
});

/** Collects a selective Parquet source stream for integration assertions. */
async function collectBatches(
  batches: AsyncIterable<ParquetSourceBatch>
): Promise<ParquetSourceBatch[]> {
  const result: ParquetSourceBatch[] = [];
  for await (const batch of batches) result.push(batch);
  return result;
}

/** Creates a minimal nullable GeoArrow WKB table for writer conformance tests. */
function createGeoArrowWKBTable(
  extensionMetadata: string | undefined,
  geometryValues: Array<Uint8Array | null>
): ObjectRowTable {
  return {
    shape: 'object-row-table',
    schema: {
      fields: [
        {
          name: 'geometry',
          type: 'binary',
          nullable: true,
          metadata: {
            'ARROW:extension:name': 'geoarrow.wkb',
            ...(extensionMetadata === undefined
              ? {}
              : {'ARROW:extension:metadata': extensionMetadata})
          }
        }
      ],
      metadata: {}
    },
    data: geometryValues.map(geometry => ({geometry}))
  };
}
