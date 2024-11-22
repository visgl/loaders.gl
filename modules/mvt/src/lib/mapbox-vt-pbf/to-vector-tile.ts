// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

// Forked from https://github.com/mapbox/vt-pbf under MIT License Copyright (c) 2015 Anand Thakker

import Pbf from 'pbf';
import type {MVTTile} from '../mvt-pbf/mvt-types';
import {writeMVT} from '../mvt-pbf/write-mvt-to-pbf';
import GeoJSONWrapper from './geojson-wrapper';

/**
 * Serialize a map of geojson layers
 * loaders.gl addition
 *
 * @param {object | object[]} geojson
 * @param {object} [options] - An object specifying the vector-tile specification version and extent that were used to create `layers`.
 * @param {number} [options.extent=4096] - Extent of the vector tile
 * @return {ArrayBuffer} uncompressed, pbf-serialized tile data
 */
export function fromGeojson(geojson, options) {
  options = options || {};
  geojson = normalizeGeojson(geojson);
  const layer = new GeoJSONWrapper(geojson.features);

  // @ts-expect-error
  return fromVectorTileJs({layers: {geojsonLayer: layer}});
}

/**
 * Serialize a vector-tile-js-created tile to pbf
 *
 * @param {object} tile
 * @return {ArrayBuffer} uncompressed, pbf-serialized tile data
 */
export function fromVectorTileJs(tile: MVTTile) {
  const pbf = new Pbf();
  writeMVT(tile, pbf);
  const uint8Array = pbf.finish();
  // TODO - make sure no byteOffsets/byteLenghts are used?
  return uint8Array.buffer.slice(
    uint8Array.byteOffset,
    uint8Array.byteOffset + uint8Array.byteLength
  );
}

/**
 * Serialized a geojson-vt-created tile to pbf.
 *
 * @param {object} vtLayers - An object mapping layer names to geojson-vt-created vector tile objects
 * @param {object} [options] - An object specifying the vector-tile specification version and extent that were used to create `layers`.
 * @param {number} [options.version=1] - Version of vector-tile spec used
 * @param {number} [options.extent=4096] - Extent of the vector tile
 * @return {ArrayBuffer} uncompressed, pbf-serialized tile data
 *
export function fromGeojsonVt(vtLayers, options) {
  options = options || {};
  const layers = {};
  for (const key in vtLayers) {
    layers[key] = new GeoJSONWrapper(vtLayers[key].features, options);
    layers[key].name = key;
    layers[key].version = options.version;
    layers[key].extent = options.extent;
  }
  return fromVectorTileJs({layers});
}
*/

export function normalizeGeojson(geojson) {
  // Array of features
  if (Array.isArray(geojson)) {
    return {
      type: 'FeatureCollection',
      features: geojson
    };
  }
  // A single feature
  if (geojson.type !== 'FeatureCollection') {
    return {
      type: 'FeatureCollection',
      features: [geojson]
    };
  }
  return geojson;
}
