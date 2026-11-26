// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {KMLFormat, KMZFormat} from './kml-format';
import type {KMLWriterData, KMLWriterOptions, KMZWriterOptions} from './kml-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Shared KMLWriter metadata and defaults. */
export const KML_WRITER_METADATA = {
  ...KMLFormat,
  version: VERSION,
  text: true,
  options: {
    kml: {
      coordinateReferenceSystem: 'OGC:CRS84'
    }
  }
} as const satisfies Writer<KMLWriterData, never, KMLWriterOptions>;

/** Metadata for encoding with KMLWriter through the core APIs. */
export const KMLWriter = {
  ...KML_WRITER_METADATA,
  dataType: null as unknown as KMLWriterData,
  batchType: null as never,
  options: KML_WRITER_METADATA.options as KMLWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {KMLWriter} = await import('./kml-writer.js');
    return KMLWriter;
  }
} as const satisfies Writer<KMLWriterData, never, KMLWriterOptions>;

/** Shared KMZWriter metadata and defaults. */
export const KMZ_WRITER_METADATA = {
  ...KMZFormat,
  version: VERSION,
  options: {
    kmz: {kmlFileName: 'doc.kml', files: {}}
  }
} as const satisfies Writer<KMLWriterData, never, KMZWriterOptions>;

/** Metadata for encoding with KMZWriter through the core APIs. */
export const KMZWriter = {
  ...KMZ_WRITER_METADATA,
  dataType: null as unknown as KMLWriterData,
  batchType: null as never,
  options: KMZ_WRITER_METADATA.options as KMZWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {KMZWriter} = await import('./kml-writer.js');
    return KMZWriter;
  }
} as const satisfies Writer<KMLWriterData, never, KMZWriterOptions>;
