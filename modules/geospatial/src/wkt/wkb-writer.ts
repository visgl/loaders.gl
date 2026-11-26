// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/core/loader-utils';
import type {Geometry, Feature} from '@loaders.gl/core/schema';
import {convertGeometryToWKB} from '@loaders.gl/core/arrow-geometry/geometry-codecs';
import {WKB_WRITER_METADATA} from './wkb-writer-types';

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
  ...WKB_WRITER_METADATA,
  async encode(data: Geometry | Feature, options?: WKBWriterOptions): Promise<ArrayBuffer> {
    return convertGeometryToWKB(data, options?.wkb);
  },
  encodeSync(data: Geometry | Feature, options?: WKBWriterOptions): ArrayBuffer {
    return convertGeometryToWKB(data, options?.wkb);
  }
} as const satisfies WriterWithEncoder<Geometry | Feature, never, WKBWriterOptions>;
