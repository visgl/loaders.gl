// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import type {Mesh, MeshArrowTable, TypedArray} from '@loaders.gl/schema';
import {convertTableToMesh} from '@loaders.gl/schema-utils';
import {extractLoadLibraryOptions} from '@loaders.gl/worker-utils';
import type {DracoMesh} from './lib/draco-types';
import type {DracoBuilderMesh, DracoBuildOptions, DracoEncodingResult} from './lib/draco-builder';
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

/** Progress notification emitted after each geometry in a batch. */
export type DracoBatchProgress = {
  /** Number of geometries completed. */
  completed: number;
  /** Total number of geometries in the batch. */
  total: number;
};

/** Options for cancellable, progress-reporting batch encoding. */
export type DracoBatchOptions = DracoWriterOptions & {
  /** Abort signal checked between native encoding operations. */
  signal?: AbortSignal;
  /** Called after each geometry is encoded. */
  onProgress?: (progress: DracoBatchProgress) => void;
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
  return (await encodeDraco(data, options)).data;
}

/** Encodes Draco geometry and returns bytes together with native encoding diagnostics. */
export async function encodeDraco(
  data: DracoWriterInput,
  options: DracoWriterOptions = {}
): Promise<DracoEncodingResult> {
  // Dynamically load draco
  const {draco} = await loadDracoEncoderModule(extractLoadLibraryOptions(options));
  const dracoBuilder = new DRACOBuilder(draco);

  try {
    return dracoBuilder.encodeSyncWithReport(normalizeDracoMesh(data), options.draco);
  } finally {
    dracoBuilder.destroy();
  }
}

/**
 * Encodes multiple geometries while loading and initializing the Draco runtime once.
 *
 * The input geometries are processed sequentially to keep peak native memory bounded.
 * Each result is independent and uses the same writer options.
 */
export async function encodeDracoBatch(
  data: DracoWriterInput[],
  options: DracoBatchOptions = {}
): Promise<DracoEncodingResult[]> {
  const {draco} = await loadDracoEncoderModule(extractLoadLibraryOptions(options));
  const dracoBuilder = new DRACOBuilder(draco);
  const results: DracoEncodingResult[] = [];
  try {
    for (const [index, geometry] of data.entries()) {
      if (options.signal?.aborted) {
        throw new Error('Draco batch encoding aborted');
      }
      results.push(dracoBuilder.encodeSyncWithReport(normalizeDracoMesh(geometry), options.draco));
      options.onProgress?.({completed: index + 1, total: data.length});
    }
    return results;
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
