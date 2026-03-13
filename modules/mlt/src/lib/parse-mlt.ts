// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Feature, GeoJSONTable, BinaryFeatureCollection} from '@loaders.gl/schema';
import {geojsonToBinary} from '@loaders.gl/gis';
import {decodeTile} from '@maplibre/mlt';
import type {Feature as MLTFeature} from '@maplibre/mlt';

import type {MLTLoaderOptions} from '../mlt-loader';
import {MLT_DEFAULT_OPTIONS} from '../mlt-loader';

type MLTOptions = Required<MLTLoaderOptions>['mlt'];

/** Geometry type constants matching @maplibre/mlt GEOMETRY_TYPE enum */
const GEOMETRY_TYPE = {
  POINT: 0,
  LINESTRING: 1,
  POLYGON: 2,
  MULTIPOINT: 3,
  MULTILINESTRING: 4,
  MULTIPOLYGON: 5
} as const;

/**
 * Parse an MLT ArrayBuffer and return GeoJSON or binary data.
 *
 * @param arrayBuffer An MLT tile as an ArrayBuffer
 * @param options
 * @returns GeoJSON features, a GeoJSON table, or a binary feature collection
 */
export function parseMLT(
  arrayBuffer: ArrayBuffer,
  options?: MLTLoaderOptions
): Feature[] | GeoJSONTable | BinaryFeatureCollection {
  const mltOptions = checkOptions(options);

  const shape = options?.mlt?.shape;
  switch (shape) {
    case 'geojson-table': {
      const table: GeoJSONTable = {
        shape: 'geojson-table',
        type: 'FeatureCollection',
        features: parseToGeojsonFeatures(arrayBuffer, mltOptions)
      };
      return table;
    }
    case 'binary': {
      const geojsonFeatures = parseToGeojsonFeatures(arrayBuffer, mltOptions);
      const binaryData = geojsonToBinary(geojsonFeatures);
      // @ts-ignore
      binaryData.byteLength = arrayBuffer.byteLength;
      return binaryData;
    }
    case 'geojson':
    default:
      return parseToGeojsonFeatures(arrayBuffer, mltOptions);
  }
}

/**
 * Parse the MLT tile and return GeoJSON features
 */
function parseToGeojsonFeatures(arrayBuffer: ArrayBuffer, options: MLTOptions): Feature[] {
  if (arrayBuffer.byteLength <= 0) {
    return [];
  }

  const tile = new Uint8Array(arrayBuffer);
  const featureTables = decodeTile(tile);

  const features: Feature[] = [];

  const selectedLayers =
    options.layers && options.layers.length > 0
      ? options.layers
      : featureTables.map((ft) => ft.name);

  for (const featureTable of featureTables) {
    if (selectedLayers.includes(featureTable.name)) {
      const layerName = featureTable.name;
      const extent = featureTable.extent;

      for (const mltFeature of featureTable) {
        const geoJSONFeature = convertFeatureToGeoJSON(mltFeature, options, layerName, extent);
        if (geoJSONFeature) {
          features.push(geoJSONFeature);
        }
      }
    }
  }

  return features;
}

/**
 * Convert an MLT Feature to a GeoJSON Feature
 */
function convertFeatureToGeoJSON(
  feature: MLTFeature,
  options: MLTOptions,
  layerName: string,
  extent: number
): Feature | null {
  const {geometry, properties, id} = feature;

  if (!geometry) {
    return null;
  }

  const geojsonGeometry = convertGeometryToGeoJSON(geometry, options, extent);
  if (!geojsonGeometry) {
    return null;
  }

  const featureProperties: {[key: string]: unknown} = {...properties};

  if (options.layerProperty) {
    featureProperties[options.layerProperty] = layerName;
  }

  const geojsonFeature: Feature = {
    type: 'Feature',
    geometry: geojsonGeometry as any,
    properties: featureProperties as any
  };

  if (id !== undefined && id !== null) {
    (geojsonFeature as any).id = id;
  }

  return geojsonFeature;
}

/**
 * Convert MLT geometry to GeoJSON geometry
 */
function convertGeometryToGeoJSON(
  geometry: MLTFeature['geometry'],
  options: MLTOptions,
  extent: number
): object | null {
  if (!geometry) {
    return null;
  }

  const {type, coordinates} = geometry;

  switch (type as number) {
    case GEOMETRY_TYPE.POINT: {
      // coordinates: [[Point]]
      const point = coordinates[0][0];
      return {
        type: 'Point',
        coordinates: projectPoint(point.x, point.y, options, extent)
      };
    }
    case GEOMETRY_TYPE.MULTIPOINT: {
      // coordinates: [[p1], [p2], ...]
      return {
        type: 'MultiPoint',
        coordinates: coordinates.map(([p]) => projectPoint(p.x, p.y, options, extent))
      };
    }
    case GEOMETRY_TYPE.LINESTRING: {
      // coordinates: [[p1, p2, ...]]
      return {
        type: 'LineString',
        coordinates: coordinates[0].map((p) => projectPoint(p.x, p.y, options, extent))
      };
    }
    case GEOMETRY_TYPE.MULTILINESTRING: {
      // coordinates: [[p1, p2, ...], [p1, p2, ...], ...]
      return {
        type: 'MultiLineString',
        coordinates: coordinates.map((ring) =>
          ring.map((p) => projectPoint(p.x, p.y, options, extent))
        )
      };
    }
    case GEOMETRY_TYPE.POLYGON: {
      // coordinates: [[outer_ring_points], [hole_ring_points], ...]
      return {
        type: 'Polygon',
        coordinates: coordinates.map((ring) =>
          ring.map((p) => projectPoint(p.x, p.y, options, extent))
        )
      };
    }
    case GEOMETRY_TYPE.MULTIPOLYGON: {
      // In MLT, multipolygon rings are flattened: [[ring1], [ring2], ...]
      // Treat each ring as its own polygon (simplified representation)
      return {
        type: 'MultiPolygon',
        coordinates: coordinates.map((ring) => [
          ring.map((p) => projectPoint(p.x, p.y, options, extent))
        ])
      };
    }
    default:
      return null;
  }
}

/**
 * Project a tile coordinate to either local (0-1) or WGS84 (lng/lat) coordinates
 */
function projectPoint(x: number, y: number, options: MLTOptions, extent: number): [number, number] {
  if (options.coordinates === 'wgs84' && options.tileIndex) {
    const {x: tx, y: ty, z} = options.tileIndex;
    const size = extent * Math.pow(2, z);
    const x0 = extent * tx;
    const y0 = extent * ty;
    const lng = ((x + x0) * 360) / size - 180;
    const y2 = 180 - ((y + y0) * 360) / size;
    const lat = (360 / Math.PI) * Math.atan(Math.exp((y2 * Math.PI) / 180)) - 90;
    return [lng, lat];
  }

  // Local coordinates: normalize to [0, 1]
  return [x / extent, y / extent];
}

/**
 * Validate loader options
 */
function checkOptions(options?: MLTLoaderOptions): MLTOptions {
  const mltOptions = options?.mlt ?? MLT_DEFAULT_OPTIONS;

  if (mltOptions.coordinates === 'wgs84' && !mltOptions.tileIndex) {
    throw new Error('MLT Loader: WGS84 coordinates require a tileIndex option');
  }

  return mltOptions;
}
