// loaders.gl, MIT license
// Forked from https://github.com/mapbox/geojson-vt under compatible ISC license

import {GeoJSONTileFeature} from './tile';

export function createFeature(id, type, geom, tags): GeoJSONTileFeature {
  const feature: GeoJSONTileFeature = {
    // eslint-disable-next-line
    id: id == null ? null : id,
    type,
    geometry: geom,
    tags,
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity
  };

  if (type === 'Point' || type === 'MultiPoint' || type === 'LineString') {
    calcLineBBox(feature, geom);
  } else if (type === 'Polygon') {
    // the outer ring (ie [0]) contains all inner rings
    calcLineBBox(feature, geom[0]);
  } else if (type === 'MultiLineString') {
    for (const line of geom) {
      calcLineBBox(feature, line);
    }
  } else if (type === 'MultiPolygon') {
    for (const polygon of geom) {
      // the outer ring (ie [0]) contains all inner rings
      calcLineBBox(feature, polygon[0]);
    }
  }

  return feature;
}

function calcLineBBox(feature, geom) {
  for (let i = 0; i < geom.length; i += 3) {
    feature.minX = Math.min(feature.minX, geom[i]);
    feature.minY = Math.min(feature.minY, geom[i + 1]);
    feature.maxX = Math.max(feature.maxX, geom[i]);
    feature.maxY = Math.max(feature.maxY, geom[i + 1]);
  }
}
