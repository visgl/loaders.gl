// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {encodeWKB} from './lib/encode-wkb';
import type {Geometry, Feature} from '@loaders.gl/schema';

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
export const WKBWriter: WriterWithEncoder<Geometry | Feature, never, WriterOptions> = {
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
    return encodeWKB(data, options?.wkb);
  },
  encodeSync(data: Geometry | Feature, options?: WriterOptions): ArrayBuffer {
    return encodeWKB(data, options?.wkb);
  }
};
