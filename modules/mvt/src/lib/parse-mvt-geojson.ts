// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {MVTGeoJSONFeature, MVTGeoJSONOptions, MVTGeoJSONTable} from './types';
import Protobuf from 'pbf';
import {VectorTile} from './vector-tile/vector-tile';

/** Parse an MVT buffer into a GeoJSON feature collection without loading binary or Arrow converters. */
export function parseMVTGeoJSON(
  arrayBuffer: ArrayBuffer,
  options: MVTGeoJSONOptions = {}
): MVTGeoJSONTable {
  const mvtOptions = options.mvt || {};
  if (mvtOptions.coordinates === 'wgs84' && !mvtOptions.tileIndex) {
    throw new Error('MVT Loader: WGS84 coordinates need tileIndex property');
  }

  const features: MVTGeoJSONFeature[] = [];
  if (arrayBuffer.byteLength > 0) {
    features.push(...parseToGeoJSONFeatures(arrayBuffer, mvtOptions));
  }

  return {shape: 'geojson-table', type: 'FeatureCollection', features};
}

/** Parse only the features from selected layers into GeoJSON without GIS or Arrow conversion code. */
export function parseToGeoJSONFeatures(
  arrayBuffer: ArrayBuffer,
  mvtOptions: NonNullable<MVTGeoJSONOptions['mvt']>
): MVTGeoJSONFeature[] {
  if (arrayBuffer.byteLength <= 0) {
    return [];
  }
  const tile = new VectorTile(new Protobuf(arrayBuffer));
  const selectedLayers = Array.isArray(mvtOptions.layers)
    ? mvtOptions.layers
    : Object.keys(tile.layers);
  const features: MVTGeoJSONFeature[] = [];

  for (const layerName of selectedLayers) {
    const vectorTileLayer = tile.layers[layerName];
    if (!vectorTileLayer) {
      continue;
    }

    for (let index = 0; index < vectorTileLayer.length; index++) {
      const vectorTileFeature = vectorTileLayer.getGeoJSONFeature(index);
      const feature: MVTGeoJSONFeature = vectorTileFeature.toGeoJSONFeature(
        mvtOptions.coordinates || 'local',
        mvtOptions.tileIndex
      );
      if (mvtOptions.layerProperty) {
        feature.properties ||= {};
        feature.properties[mvtOptions.layerProperty] = layerName;
      }
      if (mvtOptions.sourceLayer) {
        feature.sourceLayer = layerName;
      }
      features.push(feature);
    }
  }

  return features;
}
