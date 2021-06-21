import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {fetchFile, load} from '@loaders.gl/core';
import {KMLLoader} from '@loaders.gl/kml';

const KML_URL = '@loaders.gl/kml/test/data/KML_Samples.kml';
const KML_LINESTRING_URL = '@loaders.gl/kml/test/data/linestring';

const INVALID_KML = `\
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.someotherstandard.net">
  <Document>
  </Document>
</kml>
`;

test('KMLLoader#loader conformance', (t) => {
  validateLoader(t, KMLLoader, 'KMLLoader');
  t.end();
});

test('KMLLoader#testText', async (t) => {
  const response = await fetchFile(KML_URL);
  const KML = await response.text();
  const KMLTest = KMLLoader.tests && KMLLoader.tests[0];
  if (typeof KMLTest === 'string') {
    let isKML = KML.startsWith(KMLTest);
    t.equal(isKML, true, 'Correctly accepted valid KML');
    isKML = INVALID_KML.startsWith(KMLTest);
    t.equal(isKML, false, 'Correctly rejected invalid KML');
  }
  t.end();
});

test('KMLLoader#parse', async (t) => {
  const data = await load(KML_URL, KMLLoader);
  t.ok(data);
  // t.equal(data.documents.length, 2, 'Documents were found');
  // t.equal(data.markers.length, 4, 'Markers were found');
  // t.equal(data.lines.length, 6, 'Lines were found');
  // t.equal(data.polygons.length, 9, 'Polygons were found');
  // t.equal(data.overlays.length, 1, 'Overlay was found');

  // for (const key in data) {
  //   for (const object of data[key]) {
  //     t.comment(`${key}: ${JSON.stringify(object)}`);
  //   }
  // }
  t.end();
});

test('KMLLoader#parse(text)', async (t) => {
  const data = await load(KML_URL, KMLLoader, {gis: {format: 'geojson'}});
  t.equal(data.type, 'FeatureCollection', 'FeatureCollection found');
  t.equal(data.features.length, 20, 'Features were found');

  const feature = data.features[0];
  t.ok(Number.isFinite(feature.geometry.coordinates[0]));
  t.ok(Number.isFinite(feature.geometry.coordinates[1]));
  t.ok(Number.isFinite(feature.geometry.coordinates[2]));

  t.end();
});

test('KMLLoader#parse', async (t) => {
  const data = await load(`${KML_LINESTRING_URL}.kml`, KMLLoader, {gis: {format: 'geojson'}});
  const resp = await fetchFile(`${KML_LINESTRING_URL}.geojson`);
  const geojson = await resp.json();

  t.deepEqual(data, geojson, 'Data matches GeoJSON');
  t.end();
});
