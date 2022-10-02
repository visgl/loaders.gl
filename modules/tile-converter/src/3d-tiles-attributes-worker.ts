import type {WorkerObject} from '@loaders.gl/worker-utils';
import type {FeatureAttribute} from '@loaders.gl/i3s';

import {processOnWorker} from '@loaders.gl/worker-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type Tile3DAttributesWorkerOptions = {
  featureAttributes: FeatureAttribute | null;
  source: string;
};

export type I3SAttributesData = {
  tileContent: any;
  textureFormat: string;
};

/**
 * I3S Attributes Worker to handle B3DM object
 */
export const Tile3dAttributesWorker = {
  id: '3d-tiles-attributes',
  name: '3DTiles Attributes Worker',
  module: 'tile-converter',
  version: VERSION,
  options: {
    featureAttributes: null
  }
};

/**
 * Performs I3S attributes transformation
 */
export function transform3DTilesAttributesOnWorker(
  i3sAttributesData: I3SAttributesData,
  options: Tile3DAttributesWorkerOptions
): Promise<ArrayBuffer> {
  return processOnWorker(Tile3dAttributesWorker, i3sAttributesData, options);
}

export const _typecheckI3SAttributesWorker: WorkerObject = Tile3dAttributesWorker;
