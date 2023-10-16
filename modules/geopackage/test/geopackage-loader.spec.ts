import test from 'tape-promise/tape';
import {load, fetchFile} from '@loaders.gl/core';
import {GeoPackageLoader} from '@loaders.gl/geopackage';
// import {Tables, ObjectRowTable, Feature} from '@loaders.gl/schema';

const GPKG_RIVERS = '@loaders.gl/geopackage/test/data/rivers_small.gpkg';
const GPKG_RIVERS_GEOJSON = '@loaders.gl/geopackage/test/data/rivers_small.geojson';

test('GeoPackageLoader#load file as tables', async (t) => {
  const result = await load(GPKG_RIVERS, GeoPackageLoader, {
    geopackage: {
      shape: 'tables'
    }
  });

  const response = await fetchFile(GPKG_RIVERS_GEOJSON);
  const json = await response.json();

  t.equal(result.shape, 'tables');
  if (result.shape === 'tables') {
    const tableName = result.tables[0].name;
    const table = result.tables[0].table;

    t.equal(tableName, 'FEATURESriversds', 'loaded correct table name');
    t.equal(table.features.length, 1, 'Correct number of rows received');
    t.deepEqual(table.features[0], json.features[0], 'GeoPackage matches GeoJSON from OGR');

    t.ok(table.schema);
    t.equal(table.schema?.fields.length, 5);
  }

  t.end();
});

test.only('GeoPackageLoader#load file and reproject to WGS84', async (t) => {
  const result = await load(GPKG_RIVERS, GeoPackageLoader, {
    geopackage: {shape: 'tables'},
    gis: {reproject: true, _targetCrs: 'WGS84'}
  });

  t.equal(result.shape, 'tables');
  if (result.shape === 'tables') {
    const tableName = result.tables[0].name;
    const table = result.tables[0].table;

    t.equal(tableName, 'FEATURESriversds', 'loaded correct table name');
    t.ok(
      // @ts-expect-error ignore geometry collection
      table.features[0].geometry.coordinates.every((coord) =>
        insideBbox(coord, [-180, -90, 180, 90])
      ),
      'All coordinates in WGS84 lon-lat bounding box'
    );

    t.ok(table.schema);
    t.equal(table.schema?.fields.length, 5);
  }
  t.end();
});

function insideBbox(coord: [number, number], bbox: number[]): boolean {
  const [minx, miny, maxx, maxy] = bbox;
  return coord[0] >= minx && coord[0] <= maxx && coord[1] >= miny && coord[1] <= maxy;
}
