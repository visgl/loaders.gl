// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ArrowJSTable} from 'apache-arrow';
import type {GeoJSONTable, BinaryGeometry} from '@loaders.gl/core/schema';
import type {Writer, WriterOptions} from '@loaders.gl/core/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options accepted by the GeoArrow writer. */
export type GeoArrowWriterOptions = WriterOptions & {
  arrow?: {};
};

/** Shared GeoArrowWriter metadata and defaults. */
export const GEO_ARROW_WRITER_METADATA = {
  name: 'Apache Arrow',
  id: 'arrow',
  module: 'tables',
  version: VERSION,
  encoding: 'arrow',
  format: 'geoarrow',
  extensions: ['arrow', 'feather'],
  mimeTypes: [
    'application/vnd.apache.arrow.file',
    'application/vnd.apache.arrow.stream',
    'application/octet-stream'
  ],
  binary: true,
  options: {}
} as const satisfies Writer<
  GeoJSONTable | BinaryGeometry | ArrowJSTable,
  never,
  GeoArrowWriterOptions
>;

/** Metadata for encoding with GeoArrowWriter through the core APIs. */
export const GeoArrowWriter = {
  ...GEO_ARROW_WRITER_METADATA,
  dataType: null as unknown as GeoJSONTable | BinaryGeometry | ArrowJSTable,
  batchType: null as never,
  options: GEO_ARROW_WRITER_METADATA.options as GeoArrowWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {GeoArrowWriter} = await import('./geoarrow-writer.js');
    return GeoArrowWriter;
  }
} as const satisfies Writer<
  GeoJSONTable | BinaryGeometry | ArrowJSTable,
  never,
  GeoArrowWriterOptions
>;
