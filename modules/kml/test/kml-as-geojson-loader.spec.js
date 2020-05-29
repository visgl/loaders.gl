/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {parseSync} from '@loaders.gl/core';
import {KMLasGeoJsonLoader} from '@loaders.gl/kml';

import KML from './data/KML_Samples.kml';

const INVALID_KML = `\
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.someotherstandard.net">
  <Document>
  </Document>
</kml>
`;

test('KMLasGeoJsonLoader#loader conformance', t => {
  validateLoader(t, KMLasGeoJsonLoader, 'KMLasGeoJsonLoader');
  t.end();
});

test('KMLasGeoJsonLoader#testText', t => {
  let isKML = KMLasGeoJsonLoader.testText(KML);
  t.equal(isKML, true, 'Correctly accepted valid KML');

  isKML = KMLasGeoJsonLoader.testText(INVALID_KML);
  t.equal(isKML, false, 'Correctly rejected invalid KML');

  t.end();
});

test('KMLasGeoJsonLoader#parse(text)', t => {
  if (!KMLasGeoJsonLoader.supported) {
    t.comment('XML parsing not available');
  } else {
    const data = parseSync(KML, KMLasGeoJsonLoader);
    t.equal(data.type, 'FeatureCollection', 'FeatureCollection found');
    t.equal(data.features.length, 19, 'Features were found');

    const feature = data.features[0];
    t.ok(Number.isFinite(feature.geometry.coordinates[0]));
    t.ok(Number.isFinite(feature.geometry.coordinates[1]));
    t.ok(Number.isFinite(feature.geometry.coordinates[2]));
  }

  t.end();
});
