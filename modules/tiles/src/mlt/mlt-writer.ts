// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/loader-utils';
import type {Table} from 'apache-arrow';
import type {ArrowTable} from '@loaders.gl/schema';
import {encodeMLT} from './lib/encode-mlt';
import {MLTFormat} from './mlt-format';

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

// __VERSION__ is injected by babel-plugin-version-inline.
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Browser-portable MLT v1 writer for GeoArrow tiles produced by the existing tiler. */
export const MLTWriter = {
  ...MLTFormat,
  name: 'MLT Writer',
  version: VERSION,
  binary: true,
  options: {mlt: {}},
  /** Encodes a materialized tile asynchronously for the core writer API. */
  encode: async (data: ArrowTable | Table, options?: MLTWriterOptions) => encodeMLT(data, options),
  /** Encodes one tile synchronously. */
  encodeSync: encodeMLT
} as const satisfies WriterWithEncoder<ArrowTable | Table, never, MLTWriterOptions>;
