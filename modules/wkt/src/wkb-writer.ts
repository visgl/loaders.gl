// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import type {Geometry, Feature} from '@loaders.gl/schema';
import {convertGeoJSONToWKB} from '@loaders.gl/gis';
import {VERSION} from './lib/version';

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
  name: 'WKB (Well Known Binary)',
  id: 'wkb',
  module: 'wkt',
  version: VERSION,
  extensions: ['wkb'],
  options: {
    wkb: {
      hasZ: false,
      hasM: false
    }
  },
  async encode(data: Geometry | Feature, options?: WriterOptions): Promise<ArrayBuffer> {
    return convertGeoJSONToWKB(data); // , options?.wkb);
  },
  encodeSync(data: Geometry | Feature, options?: WriterOptions): ArrayBuffer {
    return convertGeoJSONToWKB(data); // , options?.wkb);
  }
} as const satisfies WriterWithEncoder<Geometry | Feature, never, WriterOptions>;
