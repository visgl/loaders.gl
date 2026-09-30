// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Feature, GeoJSONTable, Geometry} from '@loaders.gl/schema';

/** Available synthetic geometry datasets. */
export type SampleGeometry = 'points' | 'polygons';

/** Creates reproducible sample sites, or small footprints centered on the same sites. */
export function createSampleData(geometryType: SampleGeometry): GeoJSONTable {
  const neighborhoods = [
    {name: 'San Francisco', longitude: -122.425, latitude: 37.765},
    {name: 'Oakland', longitude: -122.26, latitude: 37.81},
    {name: 'Berkeley', longitude: -122.28, latitude: 37.875},
    {name: 'Alameda', longitude: -122.265, latitude: 37.755}
  ];
  let randomState = 42;
  /** Returns a deterministic random fraction for local sample generation. */
  function getRandomFraction(): number {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 2 ** 32;
  }
  const features: Feature[] = [];
  for (const neighborhood of neighborhoods) {
    for (let siteIndex = 0; siteIndex < 400; siteIndex++) {
      const angle = getRandomFraction() * Math.PI * 2;
      const distance = Math.sqrt(getRandomFraction());
      const longitude = neighborhood.longitude + Math.cos(angle) * distance * 0.035;
      const latitude = neighborhood.latitude + Math.sin(angle) * distance * 0.021;
      const halfSize = 0.00015;
      const geometry: Geometry =
        geometryType === 'points'
          ? {type: 'Point', coordinates: [longitude, latitude]}
          : {
              type: 'Polygon',
              coordinates: [
                [
                  [longitude - halfSize, latitude - halfSize],
                  [longitude + halfSize, latitude - halfSize],
                  [longitude + halfSize, latitude + halfSize],
                  [longitude - halfSize, latitude + halfSize],
                  [longitude - halfSize, latitude - halfSize]
                ]
              ]
            };
      features.push({
        type: 'Feature',
        id: features.length,
        geometry,
        properties: {
          name: `Sample site ${String(features.length + 1).padStart(4, '0')}`,
          neighborhood: neighborhood.name,
          capacity: 1 + Math.floor(getRandomFraction() * 20)
        }
      });
    }
  }
  return {shape: 'geojson-table', type: 'FeatureCollection', features};
}
