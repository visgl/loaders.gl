export default function KMLtoGeoJson(kml, options) {
  const geojson = {
    type: 'FeatureCollection',
    features: []
  };

  for (const kmlMarker of kml.markers) {
    const feature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: kmlMarker.coordinates
      },
      properties: kmlMarker
    };
    delete feature.properties.type;
    delete feature.properties.coordinates;
    geojson.features.push(feature);
  }

  for (const kmlPolygon of kml.polygons) {
    const feature = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [kmlPolygon.coordinates]
      },
      properties: kmlPolygon
    };
    delete feature.properties.type;
    delete feature.properties.coordinates;
    geojson.features.push(feature);
  }

  for (const kmlLine of kml.lines) {
    const feature = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: kmlLine.coordinates
      },
      properties: kmlLine
    };
    delete feature.properties.type;
    delete feature.properties.coordinates;
    geojson.features.push(feature);
  }

  // KML format is richer than GeoJson: Converted currently ignores:
  // - documents
  // - folders
  // - overlays
  // - links

  return geojson;
}
