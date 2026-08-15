import type {GLTFLoaderOptions} from '../../gltf-loader';
import type {GLTFWithBuffers} from '../types/gltf-types';
import {decodeMeshoptCompression} from './meshopt-compression';

/**
 * Exact glTF identifier for the Khronos meshopt buffer-view compression extension.
 *
 * Extension capability negotiation uses this exact name; `KHR_meshopt_compression` is not an alias
 * for the earlier `EXT_meshopt_compression` identifier.
 */
export const name = 'KHR_meshopt_compression';

/**
 * Decodes all `KHR_meshopt_compression` buffer views in a loaded glTF document.
 *
 * Processing is a no-op unless both `options.gltf.loadBuffers` and
 * `options.gltf.decompressMeshes` are enabled. The shared decoder supports version 0 and version 1
 * attribute streams and every KHR post-decode filter, including `COLOR`.
 *
 * @param gltfData Parsed glTF JSON together with its resolved source and destination buffers.
 * @param options glTF loader options controlling buffer loading and mesh decompression.
 * @returns A promise that resolves after all KHR meshopt buffer views have been decoded.
 * @throws If KHR and EXT meshopt declarations are mixed on the same buffer view or buffer, or if a
 * compressed stream is malformed.
 */
export async function decode(gltfData: GLTFWithBuffers, options: GLTFLoaderOptions): Promise<void> {
  await decodeMeshoptCompression(gltfData, options, name);
}
