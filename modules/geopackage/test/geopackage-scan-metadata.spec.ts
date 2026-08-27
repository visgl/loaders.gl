import {fetchFile, isBrowser} from '@loaders.gl/core';
import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {GeoPackageDataSource} from '../src/geopackage-source-loader';

const GEOPACKAGE_FIXTURE = '@loaders.gl/geopackage/test/data/rivers_multi.gpkg';

test.runIf(isBrowser)(
  'GeoPackage source exposes shared scan metadata for the default table',
  async () => {
    const response = await fetchFile(GEOPACKAGE_FIXTURE);
    const source = new GeoPackageDataSource(new Blob([await response.arrayBuffer()]), {
      geopackage: {}
    });
    source.getTable = async () => {
      throw new Error('metadata discovery must not materialize feature rows');
    };
    const metadata = await source.getQueryMetadata();

    expect(metadata.queryType).toBe('table');
    expect(metadata.execution).toEqual({status: 'supported', method: 'read'});
    expect(metadata.columns.map(column => column.name)).toContain('geometry');
    expect(metadata.columns.find(column => column.name === 'geometry')?.role).toBe('geometry');
    expect(metadata.capabilities.table?.projection).toBe('residual');
  }
);

test('GeoPackage source executes projection, residual predicates, and limits', async () => {
  const source = new GeoPackageDataSource(new Blob([]), {geopackage: {}});
  source.getTable = async () => ({
    shape: 'arrow-table',
    data: arrow.tableFromArrays({name: ['a', 'b', 'a'], value: [1, 2, 3]})
  });

  const result = await source.query({
    predicate: {op: '=', args: [{property: 'name'}, 'a']},
    columns: ['value'],
    limit: 1
  });
  expect(result.data.schema.fields.map(field => field.name)).toEqual(['value']);
  expect(Array.from(result.data.getChild('value')?.toArray() || [])).toEqual([1]);

  const batch = await source.read({limit: 2})[Symbol.asyncIterator]().next();
  expect(batch.value?.length).toBe(2);
  await expect(source.query({limit: -1})).rejects.toThrow('non-negative safe integer');
});

test.runIf(isBrowser)(
  'GeoPackage source handles missing defaults, bounds, and geometry fields',
  async () => {
    const source = new GeoPackageDataSource(new Blob([]), {geopackage: {}});
    const tableData = arrow.tableFromArrays({value: [1]});
    source.getMetadata = async () => ({
      tables: [
        {
          schema: {
            fields: [{name: 'value', type: 'float64', nullable: true}],
            metadata: {}
          },
          name: 'fallback',
          geometryColumnName: 'missing',
          geometryTypeName: 'POINT',
          isDefault: false
        }
      ]
    });
    source.getTable = async () => ({shape: 'arrow-table', data: tableData}) as never;

    const metadata = await source.getQueryMetadata();
    expect(metadata.name).toBe('fallback');
    expect(metadata.spatial).toBeUndefined();
    expect(metadata.columns[0]?.role).toBe('attribute');
  }
);

test.runIf(isBrowser)(
  'GeoPackage source marks a source geometry field when it is not normalized',
  async () => {
    const source = new GeoPackageDataSource(new Blob([]), {geopackage: {}});
    const tableData = arrow.tableFromArrays({geom: [1]});
    source.getMetadata = async () => ({
      tables: [
        {
          schema: {
            fields: [{name: 'geom', type: 'binary', nullable: true}],
            metadata: {}
          },
          name: 'geometry',
          identifier: 'identified',
          description: 'description',
          geometryColumnName: 'geom',
          geometryTypeName: 'POINT',
          bounds: [
            [0, 1],
            [2, 3]
          ],
          isDefault: true
        }
      ]
    });
    source.getTable = async () => ({shape: 'arrow-table', data: tableData}) as never;

    const metadata = await source.getQueryMetadata();
    expect(metadata.name).toBe('identified');
    expect(metadata.description).toBe('description');
    expect(metadata.spatial?.bounds).toEqual({minimum: [0, 1], maximum: [2, 3]});
    expect(metadata.columns[0]?.role).toBe('geometry');
  }
);
