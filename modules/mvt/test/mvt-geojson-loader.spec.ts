// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {MVTWriter} from '../src/mvt-writer';
import {parseMVT} from '../src/lib/parse-mvt';
import {parseMVTGeoJSON} from '../src/lib/parse-mvt-geojson';

const geojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 17,
      geometry: {type: 'Point', coordinates: [0.25, 0.75]},
      properties: {name: 'Town'}
    },
    {
      type: 'Feature',
      id: 18,
      geometry: {
        type: 'LineString',
        coordinates: [
          [0.1, 0.2],
          [0.7, 0.8]
        ]
      },
      properties: {name: 'Road'}
    }
  ]
};

const mvtTile = MVTWriter.encodeSync(geojson, {
  mvt: {layerName: 'places', extent: 4096}
});

describe('MVT GeoJSON-only parser', () => {
  test('matches the standard loader GeoJSON output and options', () => {
    const options = {
      mvt: {
        shape: 'geojson-table' as const,
        coordinates: 'local' as const,
        layerProperty: 'sourceLayer'
      }
    };
    expect(parseMVTGeoJSON(mvtTile, options)).toEqual(parseMVT(mvtTile, options));
  });

  test('selects requested layers and returns an empty feature collection for empty tiles', () => {
    const options = {mvt: {layers: ['missing']}};
    expect(parseMVTGeoJSON(mvtTile, options).features).toEqual([]);
    expect(parseMVTGeoJSON(new ArrayBuffer(0))).toEqual({
      shape: 'geojson-table',
      type: 'FeatureCollection',
      features: []
    });
  });

  test('requires tile coordinates for WGS84 output', () => {
    expect(() => parseMVTGeoJSON(mvtTile, {mvt: {coordinates: 'wgs84'}})).toThrow(
      'MVT Loader: WGS84 coordinates need tileIndex property'
    );
  });
});
