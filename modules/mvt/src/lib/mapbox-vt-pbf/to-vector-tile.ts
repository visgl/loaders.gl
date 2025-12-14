// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

// Forked from https://github.com/mapbox/vt-pbf under MIT License Copyright (c) 2015 Anand Thakker

import Pbf from 'pbf';
import type {MVTTile} from '../mvt-pbf/mvt-types';
import {writeMVT} from '../mvt-pbf/write-mvt-to-pbf';
import GeoJSONWrapper from './geojson-wrapper';
import type {Geometry} from '@loaders.gl/schema';

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
  const extent = options.extent || 4096;
  const features = convertFeaturesToVectorTileFeatures(geojson.features, extent, options.tileIndex);
  const layer = new GeoJSONWrapper(features, {...options, extent});
  (layer as any).name = options.layerName || 'geojsonLayer';
  (layer as any).version = options.version || 1;
  (layer as any).extent = options.extent || 4096;

  // @ts-expect-error
  return fromVectorTileJs({layers: {[layer.name]: layer}});
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

function convertFeaturesToVectorTileFeatures(features, extent: number, tileIndex?: {x: number; y: number; z: number}) {
  if (features.every(isVectorTileFeature)) {
    return features;
  }

  return features.map((feature) => convertFeatureToVectorTile(feature, extent, tileIndex));
}

function convertFeatureToVectorTile(feature, extent: number, tileIndex?: {x: number; y: number; z: number}) {
  const geometry = feature.geometry as Geometry;
  const type = getVectorTileType(geometry.type);

  return {
    id: typeof feature.id === 'number' ? feature.id : undefined,
    type,
    geometry: projectGeometryToTileSpace(geometry, extent, tileIndex),
    tags: feature.properties || {}
  };
}

function projectGeometryToTileSpace(geometry: Geometry, extent: number, tileIndex?: {x: number; y: number; z: number}) {
  switch (geometry.type) {
    case 'Point':
      return [projectPointToTile(geometry.coordinates as number[], extent, tileIndex)];
    case 'MultiPoint':
      return geometry.coordinates.map((coord) => projectPointToTile(coord as number[], extent, tileIndex));
    case 'LineString':
      return [geometry.coordinates.map((coord) => projectPointToTile(coord as number[], extent, tileIndex))];
    case 'MultiLineString':
      return geometry.coordinates.map((line) => line.map((coord) => projectPointToTile(coord as number[], extent, tileIndex)));
    case 'Polygon':
      return geometry.coordinates.map((ring) => ring.map((coord) => projectPointToTile(coord as number[], extent, tileIndex)));
    case 'MultiPolygon':
      return geometry.coordinates.flatMap((polygon) =>
        polygon.map((ring) => ring.map((coord) => projectPointToTile(coord as number[], extent, tileIndex)))
      );
    default:
      throw new Error(`Unsupported geometry type: ${geometry.type}`);
  }
}

function projectPointToTile(point: number[], extent: number, tileIndex?: {x: number; y: number; z: number}) {
  if (tileIndex) {
    return projectLngLatToTile(point, tileIndex, extent);
  }

  if (isNormalizedPoint(point)) {
    return [Math.round(point[0] * extent), Math.round(point[1] * extent)];
  }

  return [Math.round(point[0]), Math.round(point[1])];
}

function isNormalizedPoint(point: number[]) {
  return Math.abs(point[0]) <= 1 && Math.abs(point[1]) <= 1;
}

function projectLngLatToTile(point: number[], tileIndex: {x: number; y: number; z: number}, extent: number) {
  const [lng, lat] = point;
  const {x, y, z} = tileIndex;
  const size = extent * Math.pow(2, z);
  const x0 = extent * x;
  const y0 = extent * y;

  const worldX = ((lng + 180) / 360) * size;
  const worldY =
    ((180 - (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + ((lat * Math.PI) / 180) / 2))) * size) / 360;

  return [Math.round(worldX - x0), Math.round(worldY - y0)];
}

function isVectorTileFeature(feature): boolean {
  return typeof feature?.type === 'number' && Array.isArray(feature.geometry);
}

function getVectorTileType(type: Geometry['type']): 1 | 2 | 3 {
  switch (type) {
    case 'Point':
    case 'MultiPoint':
      return 1;
    case 'LineString':
    case 'MultiLineString':
      return 2;
    case 'Polygon':
    case 'MultiPolygon':
      return 3;
    default:
      throw new Error(`Unknown geometry type: ${type}`);
  }
}
