// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GeoJSONTable, Feature} from '@loaders.gl/schema';
import Protobuf from 'pbf';
import {VectorTile} from './vector-tile/vector-tile';
/** Options shared by the full MVT parser and the GeoJSON-only entry. */
export type MVTGeoJSONOptions = {
  mvt?: {
    coordinates?: 'wgs84' | 'local';
    tileIndex?: {x: number; y: number; z: number};
    layerProperty?: string | number;
    layers?: string[];
  };
};

/** Parse an MVT buffer into a GeoJSON feature collection without loading binary or Arrow converters. */
export function parseMVTGeoJSON(
  arrayBuffer: ArrayBuffer,
  options: MVTGeoJSONOptions = {}
): GeoJSONTable {
  const mvtOptions = options.mvt || {};
  if (mvtOptions.coordinates === 'wgs84' && !mvtOptions.tileIndex) {
    throw new Error('MVT Loader: WGS84 coordinates need tileIndex property');
  }

  const features: Feature[] = [];
  if (arrayBuffer.byteLength > 0) {
    features.push(...parseToGeoJSONFeatures(arrayBuffer, mvtOptions));
  }

  return {shape: 'geojson-table', type: 'FeatureCollection', features};
}

/** Parse only the features from selected layers into GeoJSON without GIS or Arrow conversion code. */
export function parseToGeoJSONFeatures(
  arrayBuffer: ArrayBuffer,
  mvtOptions: NonNullable<MVTGeoJSONOptions['mvt']>
): Feature[] {
  if (arrayBuffer.byteLength <= 0) {
    return [];
  }
  const tile = new VectorTile(new Protobuf(arrayBuffer));
  const selectedLayers = Array.isArray(mvtOptions.layers)
    ? mvtOptions.layers
    : Object.keys(tile.layers);
  const features: Feature[] = [];

  for (const layerName of selectedLayers) {
    const vectorTileLayer = tile.layers[layerName];
    if (!vectorTileLayer) {
      continue;
    }

    for (let index = 0; index < vectorTileLayer.length; index++) {
      const vectorTileFeature = vectorTileLayer.getGeoJSONFeature(index);
      const feature = vectorTileFeature.toGeoJSONFeature(
        mvtOptions.coordinates || 'local',
        mvtOptions.tileIndex
      );
      if (mvtOptions.layerProperty) {
        feature.properties ||= {};
        feature.properties[mvtOptions.layerProperty] = layerName;
      }
      features.push(feature);
    }
  }

  return features;
}
