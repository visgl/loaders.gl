// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/core/loader-utils';
import type {Table} from 'apache-arrow';
import {encodeMLT} from './lib/encode-mlt';
import {MLT_WRITER_METADATA} from './mlt-writer-types';

/** Controls single-layer MLT v1 encoding of tile-local GeoArrow WKB. */
export type MLTWriterOptions = WriterOptions & {
  /** MLT layer and column selection. */
  mlt?: {
    /** Nonempty layer name; defaults to features. */
    layerName?: string;
    /** GeoArrow WKB column, inferred from metadata when omitted. */
    geometryColumn?: string;
    /** Scalar attribute columns; defaults to all non-geometry columns. */
    propertyColumns?: readonly string[];
    /** Optional nonnegative safe integer feature IDs. */
    idColumn?: string;
    /** Integer tile extent; defaults to 4096. */
    extent?: number;
    /** Normalized local coordinates or integer tile grid coordinates. */
    coordinates?: 'local' | 'tile';
    /** Maximum input rows per tile; defaults to 100,000. */
    maxFeatures?: number;
  };
};

/** Browser-portable MLT v1 writer for GeoArrow tiles produced by the existing tiler. */
export const MLTWriter = {
  ...MLT_WRITER_METADATA,
  /** Encodes a materialized tile asynchronously for the core writer API. */
  encode: async (data: Table, options?: MLTWriterOptions) => encodeMLT(data, options),
  /** Encodes one tile synchronously. */
  encodeSync: encodeMLT
} as const satisfies WriterWithEncoder<Table, never, MLTWriterOptions>;
