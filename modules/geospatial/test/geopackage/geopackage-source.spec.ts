import {expect, test, vi} from 'vitest';
import {query} from '@loaders.gl/core/scan';
import * as arrow from 'apache-arrow';
import {createDataSourceSync, fetchFile, load, setLoaderOptions} from '@loaders.gl/core';
import {GeoPackageLoaderWithParser} from '@loaders.gl/geospatial/geopackage-loader';
import {GeoPackageDataSource} from '@loaders.gl/geospatial/geopackage/index';
import {GeoPackageLoader as BundledGeoPackageLoader} from '@loaders.gl/geospatial/geopackage/bundled';
const GPKG_RIVERS_MULTI = '@loaders.gl/geospatial/geopackage/test/data/rivers_multi.gpkg';
setLoaderOptions({
  _workerType: 'test',
  worker: false
});
test('GeoPackageLoaderWithParser#testURL recognizes GeoPackage URLs', () => {
  expect(GeoPackageLoaderWithParser.testURL('data.gpkg')).toBe(true);
  expect(GeoPackageLoaderWithParser.testURL('data.gpkg?download=1')).toBe(true);
  expect(GeoPackageLoaderWithParser.testURL('data.sqlite')).toBe(false);
});
test('GeoPackageLoaderWithParser#createDataSource selects GeoPackage source from URL', () => {
  expect(GeoPackageLoaderWithParser.testURL?.('data.GPKG?download=1')).toBe(true);
  expect(GeoPackageLoaderWithParser.testURL?.('data.parquet')).toBe(false);
  expect(
    GeoPackageLoaderWithParser.createDataSourceSync(GPKG_RIVERS_MULTI, {geopackage: {}}) instanceof
      GeoPackageDataSource
  ).toBe(true);

  const dataSource = createDataSourceSync(GPKG_RIVERS_MULTI, [GeoPackageLoaderWithParser], {
    geopackage: {}
  });
  expect(dataSource instanceof GeoPackageDataSource, 'returns GeoPackageDataSource').toBeTruthy();
});

test('GeoPackageLoaderWithParser exposes URL matching and executes residual queries', async () => {
  expect(GeoPackageLoaderWithParser.testURL('https://example.com/data.gpkg')).toBe(true);
  expect(GeoPackageLoaderWithParser.testURL('https://example.com/data.gpkg?table=rivers')).toBe(
    true
  );
  expect(GeoPackageLoaderWithParser.testURL('https://example.com/data.json')).toBe(false);

  const source = GeoPackageLoaderWithParser.createDataSourceSync(new Blob([]), {geopackage: {}});
  source.getTable = async () => arrow.tableFromArrays({name: ['a', 'b', 'a'], value: [1, 2, 3]});
  const result = await source.query({
    predicate: {op: '=', args: [{property: 'name'}, 'a']},
    columns: ['value'],
    limit: 1
  });

  expect(result.schema.fields.map(field => field.name)).toEqual(['value']);
  expect(Array.from(result.getChild('value')?.toArray() || [])).toEqual([1]);
});
test('GeoPackageLoaderWithParser#getMetadata returns tables and default selection', async () => {
  const dataSource = createDataSourceSync(await createFixtureBlob(), [GeoPackageLoaderWithParser], {
    core: {type: 'geopackage'},
    geopackage: {}
  }) as GeoPackageDataSource;
  const metadata = await dataSource.getMetadata();
  expect(metadata.tables.length, 'returns both vector tables').toBe(2);
  expect(
    metadata.tables.find(table => table.isDefault)?.name,
    'marks the metadata-selected default table'
  ).toBe('preferred_rivers');
  expect(
    metadata.tables.find(table => table.name === 'preferred_rivers')?.identifier,
    'includes GeoPackage table metadata'
  ).toBe('default');
  expect(
    metadata.tables.find(table => table.name === 'preferred_rivers')?.crs,
    'includes the table CRS definition'
  ).toBeTruthy();
});
test('GeoPackageLoaderWithParser#getQueryMetadata exposes the selected schema and bounds', async () => {
  const dataSource = createDataSourceSync(await createFixtureBlob(), [GeoPackageLoaderWithParser], {
    core: {type: 'geopackage'},
    geopackage: {}
  }) as GeoPackageDataSource;
  const metadata = await dataSource.getQueryMetadata();
  expect(metadata.sourceType, 'uses the shared source identifier').toBe('geopackage');
  expect(metadata.columns.length > 0, 'publishes the selected table schema').toBeTruthy();
  expect(metadata.spatial?.bounds, 'publishes feature bounds').toBeTruthy();
  expect(
    metadata.spatial?.coordinateReferenceSystems?.length,
    'publishes the selected table CRS'
  ).toBe(1);
});
test('GeoPackageLoaderWithParser#getTable matches GeoPackageLoader Arrow output', async () => {
  const fixtureResponse = await fetchFile(GPKG_RIVERS_MULTI);
  const fixtureArrayBuffer = await fixtureResponse.arrayBuffer();
  const dataSource = createDataSourceSync(
    new Blob([fixtureArrayBuffer]),
    [GeoPackageLoaderWithParser],
    {
      core: {type: 'geopackage'},
      geopackage: {}
    }
  ) as GeoPackageDataSource;
  const sourceTable = await dataSource.getTable('FEATURESriversds');
  const loaderTable = await load(fixtureArrayBuffer, BundledGeoPackageLoader, {
    geopackage: {shape: 'arrow', table: 'FEATURESriversds'}
  });
  expect(getRows(sourceTable), 'source matches loader output').toEqual(getRows(loaderTable));
});
test('GeoPackageLoaderWithParser#getTable uses the default selection heuristic', async () => {
  const dataSource = createDataSourceSync(await createFixtureBlob(), [GeoPackageLoaderWithParser], {
    core: {type: 'geopackage'},
    geopackage: {}
  }) as GeoPackageDataSource;
  const defaultTable = await dataSource.getTable();
  const preferredTable = await dataSource.getTable('preferred_rivers');
  expect(getRows(defaultTable), 'default table matches the preferred table').toEqual(
    getRows(preferredTable)
  );
});
async function createFixtureBlob(): Promise<Blob> {
  const response = await fetchFile(GPKG_RIVERS_MULTI);
  const arrayBuffer = await response.arrayBuffer();
  return new Blob([arrayBuffer]);
}
function getRows(table: arrow.Table): Record<string, unknown>[] {
  return table.toArray().map(row => row.toJSON());
}

test('qualified FROM selects a loaded GeoPackage table without changing its default table', async () => {
  const source = createDataSourceSync(await createFixtureBlob(), [GeoPackageLoaderWithParser], {
    core: {name: 'warehouse'},
    geopackage: {}
  });
  const metadata = await source.getMetadata();
  const getTable = vi.spyOn(source, 'getTable');
  const result = await query(
    {from: {source: 'warehouse', table: 'FEATURESriversds'}, limit: 1},
    {sources: [source]}
  );
  expect(result.numRows).toBe(1);
  expect(result.schema.fields.map(field => field.name)).toEqual(
    metadata.tables
      .find(table => table.name === 'FEATURESriversds')!
      .schema.fields.map(field => field.name)
  );
  expect(getTable).toHaveBeenCalledExactlyOnceWith('FEATURESriversds', {signal: undefined});
  expect(metadata.tables.find(table => table.isDefault)?.name).toBe('preferred_rivers');
  expect(source.name).toBe('warehouse');
});

test('GeoPackage metadata commands discover named schemas without opening feature readers', async () => {
  const source = createDataSourceSync(await createFixtureBlob(), [GeoPackageLoaderWithParser], {
    core: {type: 'geopackage', name: 'warehouse'},
    geopackage: {}
  }) as GeoPackageDataSource;
  const metadata = await source.getMetadata();
  const open = vi.spyOn(source, 'getTable').mockImplementation(() => {
    throw new Error('must not open features');
  });
  const tables = await query({command: 'showTables', from: 'warehouse'}, {sources: [source]});
  expect(tables.getChild('table_name')?.toArray()).toEqual(
    metadata.tables.map(table => table.name)
  );
  await expect(
    query({command: 'describe', from: 'warehouse'}, {sources: [source]})
  ).rejects.toThrow('qualified table reference');
  const selected = metadata.tables[1];
  const result = await query(
    {command: 'describe', from: {source: 'warehouse', table: selected.name}},
    {sources: [source]}
  );
  expect(result.getChild('column_name')?.toArray()).toEqual(
    selected.schema.fields.map(field => field.name)
  );
  expect(open).not.toHaveBeenCalled();
  expect((await source.getMetadata()).tables.find(table => table.isDefault)?.name).toBe(
    'preferred_rivers'
  );
});
