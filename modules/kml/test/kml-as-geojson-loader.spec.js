/* eslint-disable max-len */
import test from 'tape-catch';
import {parseFileSync} from '@loaders.gl/core';
import {KMLasGeoJsonLoader} from '@loaders.gl/kml';

import KML from '../data/KML_Samples.kml';

const INVALID_KML = `\
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.someotherstandard.net">
  <Document>
  </Document>
</kml>
`;

test('KMLasGeoJsonLoader#testText', t => {
  let isKML = KMLasGeoJsonLoader.testText(KML);
  t.equal(isKML, true, 'Correctly accepted valid KML');

  isKML = KMLasGeoJsonLoader.testText(INVALID_KML);
  t.equal(isKML, false, 'Correctly rejected invalid KML');

  t.end();
});

test('KMLasGeoJsonLoader#parseText', t => {

  if (!KMLasGeoJsonLoader.supported) {
    t.comment('XML parsing not available');
  } else {
    const data = parseFileSync(KML, KMLasGeoJsonLoader, {log: null});
    t.equal(data.type, 'FeatureCollection', 'FeatureCollection found');
    t.equal(data.features.length, 19, 'Features were found');
  }

  t.end();
});
