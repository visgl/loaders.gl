import type {GLTFLoaderOptions} from '../../gltf-loader';
import type {GLTFWithBuffers} from '../types/gltf-types';
import {decodeMeshoptCompression} from './meshopt-compression';

/** Khronos meshopt compression extension name. */
export const name = 'KHR_meshopt_compression';

/** Decodes the Khronos meshopt compression extension. */
export async function decode(gltfData: GLTFWithBuffers, options: GLTFLoaderOptions): Promise<void> {
  await decodeMeshoptCompression(gltfData, options, name);
}
