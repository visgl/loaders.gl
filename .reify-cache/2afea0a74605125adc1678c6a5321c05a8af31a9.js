"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var parseSync;module.link('@loaders.gl/core',{parseSync(v){parseSync=v}},1);var OBJLoader;module.link('@loaders.gl/obj',{OBJLoader(v){OBJLoader=v}},2);var KMLLoader;module.link('@loaders.gl/kml',{KMLLoader(v){KMLLoader=v}},3);var KML;module.link('@loaders.gl/kml/test/data/KML_Samples.kml',{default(v){KML=v}},4);/* eslint-disable max-len */







const LOADERS = [OBJLoader, KMLLoader];

test('parseSync#autoParse', t => {
  if (!KMLLoader.supported) {
    t.comment('XML parsing not available');
  } else {
    const data = parseSync(KML, LOADERS, {log: null});
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
