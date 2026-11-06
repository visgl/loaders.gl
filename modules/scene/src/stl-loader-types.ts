// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
/** Package version injected by the build. */
// @ts-ignore __VERSION__ is injected during compilation.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';
// loaders.gl
import type {Mesh} from '@loaders.gl/core/schema';

/** Loads the STL parser on demand. */
async function preload() {
  const {STLLoaderWithParser} = await import('@loaders.gl/scene/stl-loader');
  return STLLoaderWithParser;
}

/** Metadata-only loader for ASCII and binary STL triangle meshes. */
export const STLLoader = {
  name: 'STL',
  id: 'stl',
  module: 'scene',
  version: VERSION,
  extensions: ['stl'],
  mimeTypes: ['model/stl'],
  binary: true,
  dataType: null as unknown as Mesh,
  batchType: null as never,
  options: {},
  preload
} as const;
