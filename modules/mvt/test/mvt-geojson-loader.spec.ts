// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {MVTWriter} from '../src/mvt-writer';
import {parseMVT} from '../src/lib/parse-mvt';
import {parseMVTGeoJSON} from '../src/lib/parse-mvt-geojson';
import {MVTGeoJSONLoaderWithParser} from '../src/mvt-geojson-loader';
import {MVTGeoJSONLoader} from '../src/mvt-geojson-loader-types';
import {MVTLoader} from '../src/mvt-loader';

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
  test.each([
    MVTGeoJSONLoader,
    MVTLoader
  ])('registers provenance for public parsing with $name', async loader => {
    expect(loader.options.mvt.sourceLayer).toBe(false);
    const result = await parse(mvtTile, loader, {
      core: {worker: false},
      mvt: {shape: 'geojson-table', sourceLayer: true, layerProperty: null}
    });
    expect(result).toMatchObject({
      features: [
        {sourceLayer: 'places', properties: {name: 'Town'}},
        {sourceLayer: 'places', properties: {name: 'Road'}}
      ]
    });
    expect(result.features[0].properties).not.toHaveProperty('layerName');
  });

  test('preserves authored properties while exposing source-layer provenance', () => {
    const authoredProperties = {
      layerName: 'authored layer',
      sourceLayer: 'authored source',
      __tangram_layer: 'authored value'
    };
    const firstTile = MVTWriter.encodeSync(
      {...geojson, features: [{...geojson.features[0], properties: authoredProperties}]},
      {mvt: {layerName: 'places', extent: 4096}}
    );
    const secondTile = MVTWriter.encodeSync(geojson, {
      mvt: {layerName: 'roads', extent: 4096}
    });
    // MVT layers are repeated protobuf fields, so concatenation produces a two-layer tile.
    const tile = new Uint8Array(firstTile.byteLength + secondTile.byteLength);
    tile.set(new Uint8Array(firstTile));
    tile.set(new Uint8Array(secondTile), firstTile.byteLength);
    const options = {
      mvt: {
        shape: 'geojson-table' as const,
        sourceLayer: true,
        layerProperty: null,
        coordinates: 'local' as const
      }
    };
    const result = parseMVTGeoJSON(tile.buffer, options);
    expect(result).toEqual(parseMVT(tile.buffer, options));
    expect(result.features.map(feature => feature.sourceLayer)).toEqual([
      'places',
      'roads',
      'roads'
    ]);
    expect(result.features[0].properties).toEqual(authoredProperties);
    expect(result.features[0].id).toBe(17);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    expect(
      parseMVTGeoJSON(tile.buffer, {mvt: {...options.mvt, layers: ['roads']}}).features
    ).toEqual(result.features.slice(1));
    expect(
      parseMVTGeoJSON(tile.buffer, {mvt: {layerProperty: null}}).features[0]
    ).not.toHaveProperty('sourceLayer');
  });

  test('combines foreign-member provenance with the legacy layer property when requested', () => {
    const result = MVTGeoJSONLoaderWithParser.parseSync(mvtTile, {
      mvt: {...MVTGeoJSONLoader.options.mvt, sourceLayer: true}
    });
    expect(result.features[0].sourceLayer).toBe('places');
    expect(result.features[0].properties?.layerName).toBe('places');
  });

  test('keeps provenance when reprojecting and filtering GeoJSON features', () => {
    const options = {
      mvt: {
        coordinates: 'wgs84' as const,
        tileIndex: {x: 1, y: 1, z: 2},
        sourceLayer: true,
        layerProperty: null,
        layers: ['places']
      }
    };
    const result = parseMVTGeoJSON(mvtTile, options);
    const withoutProvenance = parseMVTGeoJSON(mvtTile, {
      mvt: {...options.mvt, sourceLayer: false}
    });
    expect(result.features.map(({sourceLayer, ...feature}) => feature)).toEqual(
      withoutProvenance.features
    );
    expect(result.features.map(feature => feature.sourceLayer)).toEqual(['places', 'places']);
    expect(parseMVTGeoJSON(new ArrayBuffer(0), options).features).toEqual([]);
  });

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

  test('declares and applies the default layer property through loader options', () => {
    const result = MVTGeoJSONLoaderWithParser.parseSync(mvtTile, {
      mvt: MVTGeoJSONLoader.options.mvt
    });

    expect(MVTGeoJSONLoader.options.mvt.layerProperty).toBe('layerName');
    expect(result.features[0].properties?.layerName).toBe('places');
  });
});
