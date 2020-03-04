import test from 'tape-promise/tape';
// import {FlatGeobufLoader} from '@loaders.gl/flatgeobuf';
import {fetchFile} from '@loaders.gl/core';
// import {parse, parseSync} from '@loaders.gl/core';
import {deserializeStream} from 'flatgeobuf/dist/flatgeobuf-geojson.min';
// import 'web-streams-polyfill';

const FGB_COUNTRIES_URL = '@loaders.gl/flatgeobuf/test/data/countries.fgb';
const FGB_STATES_URL = '@loaders.gl/flatgeobuf/test/data/topp_states.fgb';
const FGB_US_COUNTIES_URL = '@loaders.gl/flatgeobuf/test/data/us_counties.fgb';

test.only('Point FlatGeobuf to GeoJSON', async t => {
  const response = await fetchFile(FGB_COUNTRIES_URL);

  for await (const feature of deserializeStream(response.body)) {
    // feature.getGeometry().transform('EPSG:4326', 'EPSG:3857');
    t.comment(JSON.stringify(feature));
  }

  /*
  const geometryJSON = await parse(arrayBuffer, FlatGeobufLoader);
  t.deepEqual(geometryJSON, [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [0.5576171875, 0.185546875]
      },
      properties: {
        // eslint-disable-next-line camelcase
        cartodb_id: 3,
        // eslint-disable-next-line camelcase
        _cdb_feature_count: 1
      }
    }
  ]);
  */

  t.end();
});
