import type {LoaderWithParser, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import type {DracoLoaderOptions} from '@loaders.gl/draco';
import type {ImageBitmapLoaderOptions} from '@loaders.gl/images';
import type {TextureLoaderOptions} from '@loaders.gl/textures';
import type {ParseGLTFOptions} from './lib/parsers/parse-gltf';
import type {GLTFWithBuffers} from './lib/types/gltf-types';
import type {GLBLoaderOptions} from './glb-loader';
import {parseGLTF} from './lib/parsers/parse-gltf';
import {GLTFLoader as GLTFLoaderMetadata} from './gltf-loader';

const {preload: _GLTFLoaderPreload, ...GLTFLoaderMetadataWithoutPreload} = GLTFLoaderMetadata;

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

/**
 * GLTF loader
 */
export const GLTFLoaderWithParser = {
  ...GLTFLoaderMetadataWithoutPreload,
  parse
} as const satisfies LoaderWithParser<GLTFWithBuffers, never, GLTFLoaderOptions>;

export async function parse(
  arrayBuffer,
  options: GLTFLoaderOptions = {},
  context
): Promise<GLTFWithBuffers> {
  // Apps can call the parse method directly, we so apply default options here
  const mergedOptions = {...GLTFLoaderWithParser.options, ...options};
  mergedOptions.gltf = {...GLTFLoaderWithParser.options.gltf, ...mergedOptions.gltf};

  const byteOffset = options?.glb?.byteOffset || 0;
  const gltf = {};
  return await parseGLTF(gltf as GLTFWithBuffers, arrayBuffer, byteOffset, mergedOptions, context);
}
