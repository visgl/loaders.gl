// import type {WorkerObject} from '@loaders.gl/worker-utils';
import {processOnWorker} from '@loaders.gl/worker-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type TessellationWorkerOptions = {
  operation: 'tessellate';
};

/**
 * Worker for tessellating geometries
 */
export const TessellationWorker = {
  id: 'tessellation',
  name: 'Tesselate',
  module: 'arrow',
  version: VERSION,
  options: {}
};

/**
 * Provide type safety
 */
export function tessellateOnWorker(
  data: ArrayBuffer,
  options: TessellationWorkerOptions
): Promise<ArrayBuffer> {
  return processOnWorker(TessellationWorker, data, options);
}
