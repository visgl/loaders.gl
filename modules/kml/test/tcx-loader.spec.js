import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {fetchFile, load} from '@loaders.gl/core';
import {TCXLoader} from '@loaders.gl/kml';

const TCX_URL = '@loaders.gl/kml/test/data/tcx_sample';

test('TCXLoader#loader conformance', t => {
  validateLoader(t, TCXLoader, 'TCXLoader');
  t.end();
});

test.skip('TCXLoader#parse', async t => {
  const data = await load(`${TCX_URL}.tcx`, TCXLoader, {gis: {format: 'geojson'}});
  const resp = await fetchFile(`${TCX_URL}.geojson`);
  const geojson = await resp.json();

  t.deepEqual(data, geojson, 'Data matches GeoJSON');
  t.end();
});
