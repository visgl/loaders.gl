// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import type {} from '@loaders.gl/core/loader-utils';

import type {Table as ArrowJSTable} from 'apache-arrow';
import {encodeArrowSync} from './lib/encoders/encode-arrow';
import type {WriterWithEncoder} from '@loaders.gl/core/loader-utils';
import type {GeoJSONTable, BinaryGeometry} from '@loaders.gl/core/schema';
import {encodeGeoArrowSync} from './lib/encoders/encode-geoarrow';
import {GEO_ARROW_WRITER_METADATA, type GeoArrowWriterOptions} from './geoarrow-writer-types';

/** Apache Arrow writer */
export const GeoArrowWriter = {
  ...GEO_ARROW_WRITER_METADATA,
  encode: async function encodeArrow(data, options?): Promise<ArrayBuffer> {
    if ('batches' in data) {
      return encodeArrowSync(data);
    }
    // @ts-expect-error
    return encodeGeoArrowSync(data);
  },
  encodeSync(data, options?) {
    if ('batches' in data) {
      return encodeArrowSync(data);
    }
    // @ts-expect-error
    return encodeGeoArrowSync(data);
  }
} as const satisfies WriterWithEncoder<
  GeoJSONTable | BinaryGeometry | ArrowJSTable,
  never,
  GeoArrowWriterOptions
>;
