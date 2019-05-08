"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var parseSync;module.link('@loaders.gl/core',{parseSync(v){parseSync=v}},1);var KMLasGeoJsonLoader;module.link('@loaders.gl/kml',{KMLasGeoJsonLoader(v){KMLasGeoJsonLoader=v}},2);var KML;module.link('./data/KML_Samples.kml',{default(v){KML=v}},3);/* eslint-disable max-len */






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

test('KMLasGeoJsonLoader#parse(text)', t => {
  if (!KMLasGeoJsonLoader.supported) {
    t.comment('XML parsing not available');
  } else {
    const data = parseSync(KML, KMLasGeoJsonLoader, {log: null});
    t.equal(data.type, 'FeatureCollection', 'FeatureCollection found');
    t.equal(data.features.length, 19, 'Features were found');
  }

  t.end();
});
