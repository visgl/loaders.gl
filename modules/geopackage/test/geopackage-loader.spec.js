import test from 'tape-promise/tape';
import {load, fetchFile, isBrowser} from '@loaders.gl/core';
import {GeoPackageLoader} from '@loaders.gl/geopackage';

const GPKG_RIVERS = '@loaders.gl/geopackage/test/data/rivers_small.gpkg';
const GPKG_RIVERS_GEOJSON = '@loaders.gl/geopackage/test/data/rivers_small.geojson';

const sqlJsCDN = isBrowser ? 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/' : null;

test('GeoPackageLoader#load file', async (t) => {
  const result = await load(GPKG_RIVERS, GeoPackageLoader, {
    geopackage: {sqlJsCDN}
  });

  const response = await fetchFile(GPKG_RIVERS_GEOJSON);
  const json = await response.json();

  t.equal(result.FEATURESriversds.geojsonFeatures.length, 1, 'Correct number of rows received');
  t.deepEqual(
    result.FEATURESriversds.geojsonFeatures[0],
    json.features[0],
    'GeoPackage matches GeoJSON from OGR'
  );

  t.ok(result.FEATURESriversds.schema);
  t.equal(result.FEATURESriversds.schema.fields.length, 5);

  t.end();
});

test('GeoPackageLoader#load file and reproject to WGS84', async (t) => {
  const result = await load(GPKG_RIVERS, GeoPackageLoader, {
    geopackage: {sqlJsCDN},
    gis: {reproject: true, _targetCrs: 'WGS84'}
  });

  t.ok(
    result.FEATURESriversds.geojsonFeatures[0].geometry.coordinates.every((coord) =>
      insideBbox(coord, [-180, -90, 180, 90])
    ),
    'All coordinates in WGS84 lon-lat bounding box'
  );

  t.ok(result.FEATURESriversds.schema);
  t.equal(result.FEATURESriversds.schema.fields.length, 5);

  t.end();
});

function insideBbox(coord, bbox) {
  const [minx, miny, maxx, maxy] = bbox;
  return coord[0] >= minx && coord[0] <= maxx && coord[1] >= miny && coord[1] <= maxy;
}
