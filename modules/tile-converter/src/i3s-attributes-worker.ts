import type {WorkerObject} from '@loaders.gl/worker-utils';
import type {ConvertedAttributes} from './i3s-converter/types';
import type {Matrix4, Vector3} from '@math.gl/core';
import type {GLTFImagePostprocessed, GLTFNodePostprocessed} from '@loaders.gl/gltf';

import {processOnWorker} from '@loaders.gl/worker-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type I3SAttributesWorkerOptions = {
  _nodeWorkers: boolean;
  reuseWorkers: boolean;
  useCartesianPositions: boolean;
  source: string;
};

export type B3DMAttributesData = {
  gltfMaterials?: {id: string}[];
  nodes: GLTFNodePostprocessed[];
  images: GLTFImagePostprocessed[];
  cartographicOrigin: Vector3;
  cartesianModelMatrix: Matrix4;
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
  attributesData: B3DMAttributesData,
  options: I3SAttributesWorkerOptions
): Promise<Map<string, ConvertedAttributes>> {
  return processOnWorker(I3SAttributesWorker, attributesData, options);
}

export const _typecheckI3SAttributesWorker: WorkerObject = I3SAttributesWorker;
