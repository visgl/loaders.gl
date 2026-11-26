// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table} from 'apache-arrow';
import type {Mesh} from '@loaders.gl/core/schema';
import {VERSION} from './lib/utils/version';
import {QuantizedMeshFormat} from './terrain-format';
import type {QuantizedMeshWriterOptions} from './quantized-mesh-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

/** Shared QuantizedMeshWriter metadata and defaults. */
export const QUANTIZED_MESH_WRITER_METADATA = {
  ...QuantizedMeshFormat,
  version: VERSION,
  dataType: null as unknown as Mesh | Table,
  batchType: null as never,
  options: {
    'quantized-mesh': {}
  }
} as const satisfies Writer<Mesh | Table, never, QuantizedMeshWriterOptions>;

/** Metadata for encoding with QuantizedMeshWriter through the core APIs. */
export const QuantizedMeshWriter = {
  ...QUANTIZED_MESH_WRITER_METADATA,
  options: QUANTIZED_MESH_WRITER_METADATA.options as QuantizedMeshWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {QuantizedMeshWriter} = await import('./quantized-mesh-writer.js');
    return QuantizedMeshWriter;
  }
} as const satisfies Writer<Mesh | Table, never, QuantizedMeshWriterOptions>;
