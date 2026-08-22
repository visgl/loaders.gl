// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import type {DracoLoaderOptions} from '@loaders.gl/draco';
import {VERSION} from './lib/utils/version';
import type {ImageBitmapLoaderOptions} from '@loaders.gl/images';
import type {BasisLoaderOptions, TextureLoaderOptions} from '@loaders.gl/textures';
import type {GLTFWithBuffers} from './lib/types/gltf-types';
import type {GLBLoaderOptions} from './glb-loader';
import type {ParseGLTFOptions} from './lib/parsers/parse-gltf';
import {GLTFFormat} from './gltf-format';

/**
 * GLTF loader options
 */
export type GLTFLoaderOptions = StrictLoaderOptions &
  ImageBitmapLoaderOptions &
  Pick<BasisLoaderOptions, 'basis'> &
  TextureLoaderOptions &
  GLBLoaderOptions &
  DracoLoaderOptions & {
    gltf?: ParseGLTFOptions;
  };

/** Preloads the parser-bearing glTF loader implementation. */
async function preload() {
  const {GLTFLoaderWithParser} = await import('./gltf-loader-with-parser');
  return GLTFLoaderWithParser;
}

/** Metadata-only glTF loader. */
export const GLTFLoader = {
  dataType: null as unknown as GLTFWithBuffers,
  batchType: null as never,
  ...GLTFFormat,
  version: VERSION,
  preload,

  options: {
    gltf: {
      normalize: true, // Normalize glTF v1 to glTF v2 format (not yet stable)
      loadBuffers: true, // Fetch any linked .BIN buffers, decode base64
      loadFiles: false, // Resolve generic glTF 2.1 file references on demand
      loadExternalAssets: false, // Recursively parse glTF 2.1 external assets
      loadImages: true, // Create image objects
      decompressMeshes: true // Decompress Draco and KHR/EXT meshopt encoded data
    }
  }
} as const satisfies Loader<GLTFWithBuffers, never, GLTFLoaderOptions>;
