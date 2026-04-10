// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {convertMeshToTable, convertTableToMesh} from '@loaders.gl/schema-utils';
import {extractLoadLibraryOptions} from '@loaders.gl/worker-utils';
import type {DracoMesh} from './lib/draco-types';
import type {DracoBuildOptions} from './lib/draco-builder';
import DRACOBuilder from './lib/draco-builder';
import {loadDracoEncoderModule} from './lib/draco-module-loader';
import {VERSION} from './lib/utils/version';

/** Options for `DracoWriter`. */
export type DracoWriterOptions = WriterOptions & {
  /** Draco-specific writer options. */
  draco?: DracoBuildOptions & {
    /** Draco mesh encoding method. */
    method?: 'MESH_EDGEBREAKER_ENCODING' | 'MESH_SEQUENTIAL_ENCODING';
    /** Draco encoder speed options, as `[encodeSpeed, decodeSpeed]`. */
    speed?: [number, number];
    /** Draco quantization bit counts keyed by mesh attribute name. */
    quantization?: Record<string, number>;
    /** Draco metadata entry used to store the original attribute name. */
    attributeNameEntry?: string;
  };
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

/**
 * Browser worker doesn't work because of issue during "draco_encoder.js" loading.
 * Refused to execute script from 'https://raw.githubusercontent.com/google/draco/1.4.1/javascript/draco_encoder.js' because its MIME type ('') is not executable.
 */
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
  name: 'DRACO',
  id: 'draco',
  module: 'draco',
  version: VERSION,
  extensions: ['drc'],
  mimeTypes: ['application/octet-stream'],
  options: {
    draco: DEFAULT_DRACO_WRITER_OPTIONS
  },
  encode
} as const satisfies WriterWithEncoder<
  DracoMesh | Mesh | MeshArrowTable | Record<string, unknown>,
  unknown,
  DracoWriterOptions
>;

/** Encode Draco mesh category data. */
async function encode(
  data: DracoMesh | Mesh | MeshArrowTable | Record<string, unknown>,
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

/** Return Draco-writable mesh data, normalizing Mesh category data through MeshArrowTable first. */
function normalizeDracoMesh(
  data: DracoMesh | Mesh | MeshArrowTable | Record<string, unknown>
): DracoMesh {
  if (isMeshArrowTable(data)) {
    return convertTableToMesh(data) as DracoMesh;
  }

  if (isMesh(data)) {
    return convertTableToMesh(convertMeshToTable(data, 'arrow-table')) as DracoMesh;
  }

  return data as DracoMesh;
}

/** Return true when the input is MeshArrowTable category data. */
function isMeshArrowTable(data: unknown): data is MeshArrowTable {
  return (
    typeof data === 'object' && data !== null && 'shape' in data && data.shape === 'arrow-table'
  );
}

/** Return true when the input is plain Mesh category data. */
function isMesh(data: unknown): data is Mesh {
  return typeof data === 'object' && data !== null && 'attributes' in data && 'schema' in data;
}
