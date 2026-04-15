import test from 'tape-promise/tape';
import {createDataSource, fetchFile, setLoaderOptions} from '@loaders.gl/core';
import {
  GeoPackageArrowLoader,
  GeoPackageDataSource,
  GeoPackageSource
} from '@loaders.gl/geopackage';

const GPKG_RIVERS_MULTI = '@loaders.gl/geopackage/test/data/rivers_multi.gpkg';

setLoaderOptions({
  _workerType: 'test',
  worker: false
});

test('GeoPackageSource#createDataSource selects GeoPackage source from URL', t => {
  const dataSource = createDataSource(GPKG_RIVERS_MULTI, [GeoPackageSource], {
    geopackage: {}
  });

  t.ok(dataSource instanceof GeoPackageDataSource, 'returns GeoPackageDataSource');
  t.end();
});

test('GeoPackageSource#getMetadata returns tables and default selection', async t => {
  const dataSource = createDataSource(await createFixtureBlob(), [GeoPackageSource], {
    core: {type: 'geopackage'},
    geopackage: {}
  }) as GeoPackageDataSource;
  const metadata = await dataSource.getMetadata();

  t.equal(metadata.tables.length, 2, 'returns both vector tables');
  t.equal(
    metadata.tables.find(table => table.isDefault)?.name,
    'preferred_rivers',
    'marks the metadata-selected default table'
  );
  t.equal(
    metadata.tables.find(table => table.name === 'preferred_rivers')?.identifier,
    'default',
    'includes GeoPackage table metadata'
  );

  t.end();
});

test('GeoPackageSource#getTable matches GeoPackageArrowLoader', async t => {
  const fixtureResponse = await fetchFile(GPKG_RIVERS_MULTI);
  const fixtureArrayBuffer = await fixtureResponse.arrayBuffer();
  const dataSource = createDataSource(new Blob([fixtureArrayBuffer]), [GeoPackageSource], {
    core: {type: 'geopackage'},
    geopackage: {}
  }) as GeoPackageDataSource;

  const sourceTable = await dataSource.getTable('FEATURESriversds');
  const loaderTable = await GeoPackageArrowLoader('FEATURESriversds').parse(fixtureArrayBuffer, {});

  t.deepEqual(getRows(sourceTable), getRows(loaderTable), 'source matches loader output');
  t.end();
});

test('GeoPackageSource#getTable uses the default selection heuristic', async t => {
  const dataSource = createDataSource(await createFixtureBlob(), [GeoPackageSource], {
    core: {type: 'geopackage'},
    geopackage: {}
  }) as GeoPackageDataSource;

  const defaultTable = await dataSource.getTable();
  const preferredTable = await dataSource.getTable('preferred_rivers');

  t.deepEqual(
    getRows(defaultTable),
    getRows(preferredTable),
    'default table matches the preferred table'
  );
  t.end();
});

async function createFixtureBlob(): Promise<Blob> {
  const response = await fetchFile(GPKG_RIVERS_MULTI);
  const arrayBuffer = await response.arrayBuffer();
  return new Blob([arrayBuffer]);
}

function getRows(table): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (let rowIndex = 0; rowIndex < table.data.numRows; rowIndex++) {
    rows.push(table.data.get(rowIndex)?.toJSON() || {});
  }
  return rows;
}
