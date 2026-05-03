import type {Loader, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import type {DracoLoaderOptions} from '@loaders.gl/draco';
import {VERSION} from './lib/utils/version';
import type {ImageBitmapLoaderOptions} from '@loaders.gl/images';
import type {TextureLoaderOptions} from '@loaders.gl/textures';
import type {GLTFWithBuffers} from './lib/types/gltf-types';
import type {GLBLoaderOptions} from './glb-loader';
import type {ParseGLTFOptions} from './lib/parsers/parse-gltf';
import {GLTFFormat} from './gltf-format';

/**
 * GLTF loader options
 */
export type GLTFLoaderOptions = StrictLoaderOptions &
  ImageBitmapLoaderOptions &
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
      loadImages: true, // Create image objects
      decompressMeshes: true // Decompress Draco encoded meshes
    }
  }
} as const satisfies Loader<GLTFWithBuffers, never, GLTFLoaderOptions>;
