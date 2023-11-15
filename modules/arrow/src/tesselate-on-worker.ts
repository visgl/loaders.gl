// import type {WorkerObject} from '@loaders.gl/worker-utils';
import {processOnWorker} from '@loaders.gl/worker-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type TesselationWorkerOptions = {
  operation: 'tesselate';
};

/**
 * Worker for Zlib real-time compression and decompression
 */
export const TesselationWorker = {
  id: 'tesselation',
  name: 'tesselation',
  module: 'tesselation',
  version: VERSION,
  options: {}
};

/**
 * Provide type safety
 */
export function compressOnWorker(
  data: ArrayBuffer,
  options: TesselationWorkerOptions
): Promise<ArrayBuffer> {
  return processOnWorker(TesselationWorker, data, options);
}
