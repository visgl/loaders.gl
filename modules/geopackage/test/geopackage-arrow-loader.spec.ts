import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';
import {setLoaderOptions, fetchFile, load} from '@loaders.gl/core';
import {convertWKBTableToGeoJSON} from '@loaders.gl/gis';
import {getGeoMetadata} from '@loaders.gl/geoarrow';
import {GeoPackageArrowLoader, GeoPackageLoader} from '@loaders.gl/geopackage';

const GPKG_RIVERS = '@loaders.gl/geopackage/test/data/rivers_small.gpkg';
const GPKG_RIVERS_MULTI = '@loaders.gl/geopackage/test/data/rivers_multi.gpkg';
const GPKG_RIVERS_GEOJSON = '@loaders.gl/geopackage/test/data/rivers_small.geojson';

setLoaderOptions({
  _workerType: 'test',
  worker: false
});

test('GeoPackageArrowLoader#loader conformance', t => {
  validateLoader(t, GeoPackageArrowLoader(), 'GeoPackageArrowLoader');
  t.end();
});

test('GeoPackageArrowLoader#load file as Arrow table', async t => {
  const table = await load(GPKG_RIVERS, GeoPackageArrowLoader());
  const geoMetadata = getGeoMetadata(table.schema.metadata);

  t.equal(table.shape, 'arrow-table');
  t.equal(table.data.numRows, 1, 'loads one feature');
  t.equal(table.schema.fields.length, 5, 'schema replaces source geom column with geometry');
  t.equal(geoMetadata?.primary_column, 'geometry', 'geo metadata primary column is set');
  t.equal(geoMetadata?.columns.geometry.encoding, 'wkb', 'geo metadata identifies WKB encoding');

  const rows = getRowsFromArrowTable(table);
  const roundTripped = convertWKBTableToGeoJSON(
    {shape: 'object-row-table', schema: table.schema, data: rows},
    table.schema
  );
  const response = await fetchFile(GPKG_RIVERS_GEOJSON);
  const expected = await response.json();

  t.deepEqual(roundTripped.features, expected.features, 'Arrow output round-trips to GeoJSON');
  t.end();
});

test('GeoPackageArrowLoader#load explicit table', async t => {
  const table = await load(GPKG_RIVERS_MULTI, GeoPackageArrowLoader('FEATURESriversds'));
  const rows = getRowsFromArrowTable(table);
  const roundTripped = convertWKBTableToGeoJSON(
    {shape: 'object-row-table', schema: table.schema, data: rows},
    table.schema
  );
  const geojsonTable = await load(GPKG_RIVERS_MULTI, GeoPackageLoader, {
    geopackage: {shape: 'geojson-table', table: 'FEATURESriversds'}
  });

  t.deepEqual(
    roundTripped.features,
    geojsonTable.features,
    'explicit table matches GeoPackageLoader'
  );
  t.end();
});

test('GeoPackageArrowLoader#load default table honors metadata heuristic', async t => {
  const table = await load(GPKG_RIVERS_MULTI, GeoPackageArrowLoader());
  const defaultTable = await load(GPKG_RIVERS_MULTI, GeoPackageArrowLoader('preferred_rivers'));

  t.deepEqual(
    getRowsFromArrowTable(table),
    getRowsFromArrowTable(defaultTable),
    'default selection prefers the metadata-marked table'
  );
  t.end();
});

test('GeoPackageArrowLoader#load reprojects like GeoPackageLoader', async t => {
  const arrowTable = await load(GPKG_RIVERS, GeoPackageArrowLoader(), {
    gis: {reproject: true, _targetCrs: 'WGS84'}
  });
  const geojsonTable = await load(GPKG_RIVERS, GeoPackageLoader, {
    geopackage: {shape: 'geojson-table'},
    gis: {reproject: true, _targetCrs: 'WGS84'}
  });

  const rows = getRowsFromArrowTable(arrowTable);
  const roundTripped = convertWKBTableToGeoJSON(
    {shape: 'object-row-table', schema: arrowTable.schema, data: rows},
    arrowTable.schema
  );

  t.deepEqual(roundTripped.features, geojsonTable.features, 'reprojected features match');
  t.end();
});

test('GeoPackageArrowLoader#load missing table errors clearly', async t => {
  try {
    await load(GPKG_RIVERS_MULTI, GeoPackageArrowLoader(), {
      geopackage: {table: 'missing_table_name'}
    });
    t.fail('expected load to throw');
  } catch (error) {
    t.ok(
      (error as Error).message.includes('GeoPackage table not found: missing_table_name'),
      'throws a clear missing-table error'
    );
  }

  t.end();
});

function getRowsFromArrowTable(table): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (let rowIndex = 0; rowIndex < table.data.numRows; rowIndex++) {
    rows.push(table.data.get(rowIndex)?.toJSON() || {});
  }
  return rows;
}
