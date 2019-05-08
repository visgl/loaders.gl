"use strict";var XMLLoader;module.link('@loaders.gl/experimental',{XMLLoader(v){XMLLoader=v}},0);var KMLParser;module.link('./kml-parser',{default(v){KMLParser=v}},1);var normalizeKML;module.link('./kml-normalizer',{default(v){normalizeKML=v}},2);var convertKMLToGeoJson;module.link('./kml-to-geojson',{default(v){convertKMLToGeoJson=v}},3);




const KML_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
`;

const DEFAULT_OPTIONS = {
  normalize: true
};

function testText(text) {
  return text.startsWith(KML_HEADER);
}

function parseTextSync(text, options = DEFAULT_OPTIONS) {
  const xml = XMLLoader.parseTextSync(text);
  const kmlLoader = new KMLParser();
  let kml = kmlLoader.parse(xml, options);
  kml = normalizeKML(kml);
  return convertKMLToGeoJson(kml, options);
}

module.exportDefault({
  name: 'KML',
  extensions: ['kml'],
  category: 'geojson',
  supported: XMLLoader.supported,
  testText,
  parseTextSync,
  browserOnly: true,
  worker: false,
  DEFAULT_OPTIONS
});
