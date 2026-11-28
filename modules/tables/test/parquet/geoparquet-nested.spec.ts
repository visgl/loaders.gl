// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {encode, load} from '@loaders.gl/core';
import type {DataType, ObjectRowTable} from '@loaders.gl/core/schema';
import {GeoParquetLoader} from '@loaders.gl/tables/parquet';
import {ParquetSource, ParquetWriter} from '@loaders.gl/tables/parquet/bundled';
import {expect, test} from 'vitest';
import {getParquetBatchProvenance} from '../../src/parquet/lib/native-parquet-batches';

const pointType: DataType = {
  type: 'struct',
  children: [
    {name: 'x', type: 'float64', nullable: false},
    {name: 'y', type: 'float64', nullable: false}
  ]
};

const lineType: DataType = {
  type: 'list',
  children: [{name: 'element', type: pointType, nullable: false}]
};

const polygonType: DataType = {
  type: 'list',
  children: [{name: 'element', type: lineType, nullable: false}]
};

const multipolygonType: DataType = {
  type: 'list',
  children: [{name: 'element', type: polygonType, nullable: false}]
};

const outerRing = [{x: 0, y: 0}, {x: 8, y: 0}, {x: 8, y: 8}, {x: 0, y: 0}];
const innerRing = [{x: 2, y: 1}, {x: 4, y: 3}, {x: 4, y: 1}, {x: 2, y: 1}];

test.each([
  {encoding: 'linestring', geometryType: 'LineString', type: lineType, geometry: outerRing},
  {encoding: 'polygon', geometryType: 'Polygon', type: polygonType, geometry: [outerRing, innerRing]},
  {encoding: 'multipolygon', geometryType: 'MultiPolygon', type: multipolygonType, geometry: [[outerRing, innerRing], [innerRing]]}
])('GeoParquet loader and source preserve native $encoding coordinates', async ({
  encoding,
  geometryType,
  type,
  geometry
}) => {
  const geometries = [geometry, [], null, geometry];
  const input: ObjectRowTable = {
    shape: 'object-row-table',
    schema: {
      fields: [
        {name: 'id', type: 'int32', nullable: false},
        {name: 'geometry', type, nullable: true}
      ],
      metadata: {
        geo: JSON.stringify({
          version: '1.1.0',
          primary_column: 'geometry',
          columns: {geometry: {encoding, geometry_types: [geometryType]}}
        })
      }
    },
    data: geometries.map((value, id) => ({id, geometry: value}))
  };
  const buffer = await encode(input, ParquetWriter, {core: {worker: false}});
  const loaded = await load(buffer, GeoParquetLoader, {
    core: {worker: false},
    parquet: {shape: 'arrow', columns: ['geometry'], offset: 1, batchSize: 2}
  });
  expect(JSON.parse(JSON.stringify(loaded.getChild('geometry')?.toArray()))).toEqual(
    geometries.slice(1)
  );
  expect(loaded.schema.fields[0].metadata.get('ARROW:extension:name')).toBe(
    `geoarrow.${encoding}`
  );

  for (const worker of [false, true]) {
    const source = new ParquetSource(new Blob([buffer]), {
      core: {worker, reuseWorkers: false, _workerType: 'test'}
    });
    try {
      const sourceGeometries: unknown[] = [];
      for await (const batch of source.read({batchSize: 2})) {
        expect(batch.schema.fields.find(field => field.name === 'geometry')?.metadata.get('ARROW:extension:name')).toBe(
          `geoarrow.${encoding}`
        );
        expect(getParquetBatchProvenance(batch)).toMatchObject({
          rowCount: batch.numRows,
          rowOffset: sourceGeometries.length
        });
        sourceGeometries.push(
          ...JSON.parse(JSON.stringify(batch.getChild('geometry')?.toArray()))
        );
      }
      expect(sourceGeometries, `worker: ${worker}`).toEqual(geometries);

      // Exercise both filtering decoded columns and gathering a late-materialized Arrow projection.
      for (const columns of [undefined, ['geometry']]) {
        const selectedGeometries: unknown[] = [];
        for await (const batch of source.read({
          columns,
          batchSize: 2,
          predicate: {op: '>=', args: [{property: 'id'}, 1]}
        })) {
          selectedGeometries.push(
            ...JSON.parse(JSON.stringify(batch.getChild('geometry')?.toArray()))
          );
        }
        expect(selectedGeometries, `columns: ${columns}, worker: ${worker}`).toEqual(
          geometries.slice(1)
        );
      }
    } finally {
      await source.close();
    }
  }
});
