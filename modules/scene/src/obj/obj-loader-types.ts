// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {Mesh, MeshArrowTable, ArrowTableBatch} from '@loaders.gl/core/schema';
import {OBJFormat} from './obj-format';
import {serializeArrowWorkerTable} from '@loaders.gl/core/schema-utils/arrow-transport';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type OBJLoaderOptions = LoaderOptions & {
  obj?: {
    /** Output shape. Defaults to a Mesh Arrow table. */
    shape?: 'mesh' | 'arrow-table';
    /** Treat OBJ vertex records as a point cloud and stream `v` rows in batches. */
    pointCloud?: boolean;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/** Legacy OBJ mesh batch returned after caller-side conversion. */
export type OBJMeshBatch = {
  /** Legacy mesh batch shape. */
  shape: 'mesh';
  /** Parsed data batch discriminator. */
  batchType: 'data';
  /** Decoded mesh. */
  data: Mesh;
  /** Number of vertices. */
  length: number;
};

/** Public OBJ batch output shapes. */
export type OBJParsedBatch = OBJMeshBatch | ArrowTableBatch;

/**
 * Preloads the parser-bearing OBJ loader implementation.
 */
async function preload() {
  const {OBJLoaderWithParser} = await import('@loaders.gl/scene/obj/obj-loader');
  return OBJLoaderWithParser;
}

/**
 * Metadata-only worker loader for the OBJ geometry format
 */
export const OBJLoader = {
  ...OBJFormat,

  dataType: null as unknown as Mesh | MeshArrowTable,
  batchType: null as unknown as OBJParsedBatch,
  version: VERSION,
  worker: true,
  /** Enables the stateful input/output batch protocol on the built-in worker. */
  workerInBatches: true,
  serializeWorkerResult: serializeArrowWorkerTable,
  text: true,
  testText: testOBJFile,
  options: {
    obj: {shape: 'arrow-table'}
  },
  preload
} as const satisfies Loader<Mesh | MeshArrowTable, OBJParsedBatch, OBJLoaderOptions>;

function testOBJFile(text: string): boolean {
  // TODO - There could be comment line first
  return text[0] === 'v';
}

/** @deprecated Use OBJLoader. */
export const OBJWorkerLoader = OBJLoader;
