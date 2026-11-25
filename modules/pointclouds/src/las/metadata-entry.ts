// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {LASLoader} from './las-loader-types';
export {LASFormat} from './las-format';
export type * from './index';
import {LAS_LOADER_METADATA} from './las-loader-shared';

/** Defers the column-oriented LAS parser. */
export const LASColumnLoader = {
  ...LAS_LOADER_METADATA,
  worker: true,
  workerInBatches: true,
  async preload() {
    const implementation = await import('./las-loader.js');
    return implementation.LASColumnLoader;
  }
} as const;
