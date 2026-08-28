// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import type {Mesh, MeshArrowTable, TypedArray} from '@loaders.gl/schema';
import {convertTableToMesh} from '@loaders.gl/schema-utils';
import {extractLoadLibraryOptions} from '@loaders.gl/worker-utils';
import type {DracoMesh} from './lib/draco-types';
import type {DracoBuilderMesh, DracoBuildOptions} from './lib/draco-builder';
import DRACOBuilder from './lib/draco-builder';
import {loadDracoEncoderModule} from './lib/draco-module-loader';
import {VERSION} from './lib/utils/version';
import {DracoFormat} from './draco-format';

/** Legacy flat attribute map accepted by `DracoWriter`. */
export type DracoWriterAttributes = Record<string, TypedArray>;

/** Inputs accepted by `DracoWriter`. */
export type DracoWriterInput =
  | DracoMesh
  | Mesh
  | MeshArrowTable
  | DracoBuilderMesh
  | DracoWriterAttributes;

/** Options for `DracoWriter`. */
export type DracoWriterOptions = WriterOptions & {
  /** Draco-specific writer options. */
  draco?: DracoBuildOptions;
};

const DEFAULT_DRACO_WRITER_OPTIONS = {
  pointcloud: false, // Set to true if pointcloud (mode: 0, no indices)
  attributeNameEntry: 'name'
  // Draco Compression Parameters
  // method: 'MESH_EDGEBREAKER_ENCODING', // Use draco defaults
  // speed: [5, 5], // Use draco defaults
  // quantization: { // Use draco defaults
  //   POSITION: 10
  // }
};

/** Worker-enabled exporter for Draco3D compressed geometries. */
export const DracoWriterWorker = {
  id: 'draco-writer',
  name: 'Draco compressed geometry writer',
  module: 'draco',
  version: VERSION,
  worker: true,
  options: {
    draco: {},
    source: null
  }
};

/**
 * Exporter for Draco3D compressed geometries
 */
export const DracoWriter = {
  ...DracoFormat,
  name: 'DRACO',
  version: VERSION,
  options: {
    draco: DEFAULT_DRACO_WRITER_OPTIONS
  },
  encode
} as const satisfies WriterWithEncoder<DracoWriterInput, unknown, DracoWriterOptions>;

/** Encode Draco mesh category data. */
async function encode(
  data: DracoWriterInput,
  options: DracoWriterOptions = {}
): Promise<ArrayBuffer> {
  // Dynamically load draco
  const {draco} = await loadDracoEncoderModule(extractLoadLibraryOptions(options));
  const dracoBuilder = new DRACOBuilder(draco);

  try {
    return dracoBuilder.encodeSync(normalizeDracoMesh(data), options.draco);
  } finally {
    dracoBuilder.destroy();
  }
}

/** Returns Draco-writable mesh data without copying ordinary Mesh attributes. */
function normalizeDracoMesh(data: DracoWriterInput): DracoBuilderMesh {
  if (isMeshArrowTable(data)) {
    return convertTableToMesh(data);
  }

  if (isDracoBuilderMesh(data)) {
    return data;
  }

  const {indices, ...attributes} = data;
  return {attributes, ...(indices ? {indices} : {})};
}

/** Return true when the input is MeshArrowTable category data. */
function isMeshArrowTable(data: unknown): data is MeshArrowTable {
  return (
    typeof data === 'object' && data !== null && 'shape' in data && data.shape === 'arrow-table'
  );
}

/** Returns true when input uses the nested Mesh attribute representation. */
function isDracoBuilderMesh(data: DracoWriterInput): data is DracoBuilderMesh | Mesh | DracoMesh {
  return (
    typeof data === 'object' &&
    data !== null &&
    'attributes' in data &&
    typeof data.attributes === 'object' &&
    data.attributes !== null &&
    !ArrayBuffer.isView(data.attributes)
  );
}
