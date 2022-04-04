import type {B3DMContent} from '@loaders.gl/3d-tiles';
import type {WorkerObject} from '@loaders.gl/worker-utils';
import type {ConvertedAttributes} from './i3s-converter/types';

import {processOnWorker} from '@loaders.gl/worker-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type I3SAttributesWorkerOptions = {
  useCartesianPositions: boolean;
  source: string;
};

/**
 * I3S Attributes Worker to handle B3DM object
 */
export const I3SAttributesWorker = {
  id: 'i3s-attributes',
  name: 'I3S Attributes Worker',
  module: 'tile-converter',
  version: VERSION,
  options: {
    useCartesianPositions: false
  }
};

/**
 * Performs I3S attributes transformation
 */
export function transformI3SAttributesOnWorker(
  tileContent: B3DMContent,
  options: I3SAttributesWorkerOptions
): Promise<Map<string, ConvertedAttributes>> {
  return processOnWorker(I3SAttributesWorker, tileContent, options);
}

export const _typecheckI3SAttributesWorker: WorkerObject = I3SAttributesWorker;
