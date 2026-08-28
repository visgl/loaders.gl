// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  canEncodeWithWorker,
  type WriterWithEncoder,
  type WriterOptions
} from '@loaders.gl/loader-utils';
import type {Mesh, MeshArrowTable, TypedArray} from '@loaders.gl/schema';
import {convertTableToMesh} from '@loaders.gl/schema-utils';
import {extractLoadLibraryOptions, processOnWorkerInBatches} from '@loaders.gl/worker-utils';
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

/** A batch of Draco-writable geometries. */
export type DracoWriterInputBatch = DracoWriterInput[];

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
  ...DracoFormat,
  id: 'draco-writer',
  name: 'Draco compressed geometry writer',
  module: 'draco',
  version: VERSION,
  worker: true,
  workerNode: 'draco-writer-worker-node.cjs',
  options: {
    draco: {}
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
  encode,
  encodeInBatches
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
  throwIfAborted(options.signal);
  const results: DracoEncodingResult[] = [];
  let completed = 0;
  for await (const result of encodeDracoInBatches([data], options)) {
    results.push(result);
    completed++;
    options.onProgress?.({completed, total: data.length});
  }
  return results;
}

/**
 * Encodes geometry batches while retaining one encoder runtime and one worker
 * lease for the complete input iterator.
 *
 * Worker mode is selected with `worker: true` and the normal Draco writer
 * worker options. Set `worker: false` to keep the operation local.
 */
export function encodeDracoInBatches(
  data: AsyncIterable<DracoWriterInputBatch> | Iterable<DracoWriterInputBatch>,
  options: DracoBatchOptions = {}
): AsyncIterable<DracoEncodingResult> {
  const normalizedData = normalizeDracoInputBatches(data);
  if (canEncodeWithWorker(DracoWriterWorker, options)) {
    return processOnWorkerInBatches<DracoBuilderMesh[], DracoEncodingResult>(
      DracoWriterWorker,
      normalizedData,
      options
    );
  }
  return encodeDracoInBatchesLocally(normalizedData, options);
}

/** Encodes batches through the public writer's ArrayBuffer-only batch API. */
async function* encodeInBatches(
  data: AsyncIterable<DracoWriterInput> | Iterable<DracoWriterInput>,
  options: DracoBatchOptions = {}
): AsyncIterable<ArrayBuffer> {
  const geometryBatches = (async function* () {
    for await (const geometry of data) {
      yield [geometry];
    }
  })();
  for await (const result of encodeDracoInBatches(geometryBatches, options)) {
    yield result.data;
  }
}

/** Worker-safe local implementation that initializes Draco exactly once. */
export async function* encodeDracoInBatchesLocally(
  data: AsyncIterable<DracoBuilderMesh[]> | Iterable<DracoBuilderMesh[]>,
  options: DracoBatchOptions = {}
): AsyncIterable<DracoEncodingResult> {
  const {draco} = await loadDracoEncoderModule(extractLoadLibraryOptions(options));
  const dracoBuilder = new DRACOBuilder(draco);
  try {
    for await (const batch of data) {
      for (const geometry of batch) {
        throwIfAborted(options.signal);
        yield dracoBuilder.encodeSyncWithReport(geometry, options.draco);
      }
    }
  } finally {
    dracoBuilder.destroy();
  }
}

/** Converts any accepted input batch into structured-clone-safe builder meshes. */
async function* normalizeDracoInputBatches(
  data: AsyncIterable<DracoWriterInputBatch> | Iterable<DracoWriterInputBatch>
): AsyncIterable<DracoBuilderMesh[]> {
  for await (const batch of data) {
    yield batch.map(normalizeDracoMesh);
  }
}

/** Throws the signal's reason before starting or between native encodes. */
function throwIfAborted(signal: AbortSignal | undefined): void {
  if (!signal?.aborted) {
    return;
  }
  if (signal.reason !== undefined) {
    throw signal.reason;
  }
  const error = new Error('Draco batch encoding aborted');
  error.name = 'AbortError';
  throw error;
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
