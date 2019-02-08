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
    debugger;
    const data = parseFileSync(KML, KMLasGeoJsonLoader, {log: null});
    t.equal(data.documents.length, 2, 'Documents were found');
    t.equal(data.markers.length, 4, 'Markers were found');
    t.equal(data.lines.length, 6, 'Lines were found');
    t.equal(data.polygons.length, 9, 'Polygons were found');
    t.equal(data.overlays.length, 1, 'Overlay was found');

    // for (const key in data) {
    //   for (const object of data[key]) {
    //     t.comment(`${key}: ${JSON.stringify(object)}`);
    //   }
    // }
  }

  t.end();
});
