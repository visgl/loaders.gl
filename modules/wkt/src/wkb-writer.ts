// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import type {Geometry, Feature} from '@loaders.gl/schema';
import {writeWKB} from '@math.gl/wkb';
import type {WellKnownDimension, WellKnownGeometry} from '@math.gl/wkb';
import {VERSION} from './lib/version';
import {WKBFormat} from './wkt-format';

export type WKBWriterOptions = WriterOptions & {
  wkb?: {
    /** Does the GeoJSON input have Z values? */
    hasZ?: boolean;

    /** Does the GeoJSON input have M values? */
    hasM?: boolean;

    /** Spatial reference for input GeoJSON */
    srid?: any;
  };
};

/**
 * WKB exporter
 */
export const WKBWriter = {
  ...WKBFormat,
  name: 'WKB (Well Known Binary)',
  id: 'wkb',
  module: 'wkt',
  version: VERSION,
  extensions: ['wkb'],
  mimeTypes: ['application/wkb', 'application/octet-stream'],
  options: {
    wkb: {
      hasZ: false,
      hasM: false
    }
  },
  async encode(data: Geometry | Feature, options?: WKBWriterOptions): Promise<ArrayBuffer> {
    return encodeWKB(data, options?.wkb);
  },
  encodeSync(data: Geometry | Feature, options?: WKBWriterOptions): ArrayBuffer {
    return encodeWKB(data, options?.wkb);
  }
} as const satisfies WriterWithEncoder<Geometry | Feature, never, WKBWriterOptions>;

/** Encodes a GeoJSON geometry using the dependency-free math.gl WKB codec. */
function encodeWKB(data: Geometry | Feature, options?: WKBWriterOptions['wkb']): ArrayBuffer {
  const geometry = data.type === 'Feature' ? data.geometry : data;
  if (!geometry) throw new Error('WKB writer does not support null feature geometry');
  const dimension = getWKBDimension(options);
  const normalizedGeometry = normalizeEmptyPoints(geometry, dimension);
  const bytes = writeWKB(normalizedGeometry as unknown as WellKnownGeometry, dimension);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

/** Resolves the legacy WKB writer dimension options. */
function getWKBDimension(options?: WKBWriterOptions['wkb']): WellKnownDimension {
  if (options?.hasZ && options?.hasM) return 'xyzm';
  if (options?.hasZ) return 'xyz';
  if (options?.hasM) return 'xym';
  return 'xy';
}

/** Encodes empty points as NaN ordinates, matching the existing loaders.gl WKB behavior. */
function normalizeEmptyPoints(geometry: Geometry, dimension: WellKnownDimension): Geometry {
  if (geometry.type === 'Point' && geometry.coordinates.length === 0) {
    return {...geometry, coordinates: Array(getDimensionSize(dimension)).fill(Number.NaN)};
  }
  if (geometry.type === 'MultiPoint') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map(coordinate =>
        coordinate.length === 0 ? Array(getDimensionSize(dimension)).fill(Number.NaN) : coordinate
      )
    };
  }
  if (geometry.type === 'GeometryCollection') {
    return {
      ...geometry,
      geometries: geometry.geometries.map(child => normalizeEmptyPoints(child, dimension))
    };
  }
  return geometry;
}

/** Returns the number of ordinates in a WKB dimension. */
function getDimensionSize(dimension: WellKnownDimension): number {
  return dimension === 'xy' ? 2 : dimension === 'xyzm' ? 4 : 3;
}
