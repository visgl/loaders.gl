import type {LoaderWithParser, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import type {DracoLoaderOptions} from '@loaders.gl/draco';
import {VERSION} from './lib/utils/version';
import type {ImageLoaderOptions} from '@loaders.gl/images';
import type {TextureLoaderOptions} from '@loaders.gl/textures';
import type {ParseGLTFOptions} from './lib/parsers/parse-gltf';
import type {GLTFWithBuffers} from './lib/types/gltf-types';
import type {GLBLoaderOptions} from './glb-loader';
import {parseGLTF} from './lib/parsers/parse-gltf';

/**
 * GLTF loader options
 */
export type GLTFLoaderOptions = StrictLoaderOptions &
  ImageLoaderOptions &
  TextureLoaderOptions &
  GLBLoaderOptions &
  DracoLoaderOptions & {
    gltf?: ParseGLTFOptions;
  };

/**
 * GLTF loader
 */
export const GLTFLoader = {
  dataType: null as unknown as GLTFWithBuffers,
  batchType: null as never,
  name: 'glTF',
  id: 'gltf',
  module: 'gltf',
  version: VERSION,
  extensions: ['gltf', 'glb'],
  mimeTypes: ['model/gltf+json', 'model/gltf-binary'],

  text: true,
  binary: true,
  tests: ['glTF'],
  parse,

  options: {
    gltf: {
      normalize: true, // Normalize glTF v1 to glTF v2 format (not yet stable)
      loadBuffers: true, // Fetch any linked .BIN buffers, decode base64
      loadImages: true, // Create image objects
      decompressMeshes: true // Decompress Draco encoded meshes
    }
  }
} as const satisfies LoaderWithParser<GLTFWithBuffers, never, GLTFLoaderOptions>;

export async function parse(
  arrayBuffer,
  options: GLTFLoaderOptions = {},
  context
): Promise<GLTFWithBuffers> {
  // Apps can call the parse method directly, we so apply default options here
  const mergedOptions = {...GLTFLoader.options, ...options};
  mergedOptions.gltf = {...GLTFLoader.options.gltf, ...mergedOptions.gltf};

  const byteOffset = options?.glb?.byteOffset || 0;
  const gltf = {};
  return await parseGLTF(gltf as GLTFWithBuffers, arrayBuffer, byteOffset, mergedOptions, context);
}
