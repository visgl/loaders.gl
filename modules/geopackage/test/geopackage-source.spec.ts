import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {createDataSource, fetchFile, load, setLoaderOptions} from '@loaders.gl/core';
import {getTableRowAsObject} from '@loaders.gl/schema-utils';
import {GeoPackageDataSource, GeoPackageSource} from '@loaders.gl/geopackage';
import {GeoPackageLoader as BundledGeoPackageLoader} from '@loaders.gl/geopackage/bundled';
const GPKG_RIVERS_MULTI = '@loaders.gl/geopackage/test/data/rivers_multi.gpkg';
setLoaderOptions({
  _workerType: 'test',
  worker: false
});
test('GeoPackageSource#createDataSource selects GeoPackage source from URL', () => {
  const dataSource = createDataSource(GPKG_RIVERS_MULTI, [GeoPackageSource], {
    geopackage: {}
  });
  expect(dataSource instanceof GeoPackageDataSource, 'returns GeoPackageDataSource').toBeTruthy();
});

test('GeoPackageSource exposes URL matching and executes residual queries', async () => {
  expect(GeoPackageSource.testURL('https://example.com/data.gpkg')).toBe(true);
  expect(GeoPackageSource.testURL('https://example.com/data.gpkg?table=rivers')).toBe(true);
  expect(GeoPackageSource.testURL('https://example.com/data.json')).toBe(false);

  const source = GeoPackageSource.createDataSource(new Blob([]), {geopackage: {}});
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
});
test('GeoPackageSource#getMetadata returns tables and default selection', async () => {
  const dataSource = createDataSource(await createFixtureBlob(), [GeoPackageSource], {
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
test('GeoPackageSource#getQueryMetadata exposes the selected schema and bounds', async () => {
  const dataSource = createDataSource(await createFixtureBlob(), [GeoPackageSource], {
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
test('GeoPackageSource#getTable matches GeoPackageLoader Arrow output', async () => {
  const fixtureResponse = await fetchFile(GPKG_RIVERS_MULTI);
  const fixtureArrayBuffer = await fixtureResponse.arrayBuffer();
  const dataSource = createDataSource(new Blob([fixtureArrayBuffer]), [GeoPackageSource], {
    core: {type: 'geopackage'},
    geopackage: {}
  }) as GeoPackageDataSource;
  const sourceTable = await dataSource.getTable('FEATURESriversds');
  const loaderTable = await load(fixtureArrayBuffer, BundledGeoPackageLoader, {
    geopackage: {shape: 'arrow-table', table: 'FEATURESriversds'}
  });
  expect(getRows(sourceTable), 'source matches loader output').toEqual(getRows(loaderTable));
});
test('GeoPackageSource#getTable uses the default selection heuristic', async () => {
  const dataSource = createDataSource(await createFixtureBlob(), [GeoPackageSource], {
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
function getRows(table): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (let rowIndex = 0; rowIndex < table.data.numRows; rowIndex++) {
    rows.push(getTableRowAsObject(table, rowIndex, {}));
  }
  return rows;
}
