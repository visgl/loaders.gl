import {encodeGLBSync} from './encode-glb';
import {encodeExtensions} from '../api/gltf-extensions';
import {GLTFWriterOptions} from '../../gltf-writer';
import {GLTFWithBuffers} from '@loaders.gl/gltf';
import {GLTFScenegraph} from '../api/gltf-scenegraph';

export type GLTFEncodeOptions = Record<string, any>;

/**
 * Encode the full glTF file as a binary GLB file
 * Returns an ArrayBuffer that represents the complete GLB image that can be saved to file
 *
 * @todo - Does not support encoding to non-GLB versions of glTF format. Other formats
 * - Encode as a textual JSON file with binary data in base64 data URLs.
 * - Encode as a JSON with all images (and buffers?) in separate binary files
 *
 * glb-file-format-specification
 * @see https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#
 *
 * @param gltf
 * @param arrayBuffer
 * @param byteOffset
 * @param options
 * @returns
 */
export function encodeGLTFSync(
  gltf: GLTFWithBuffers,
  arrayBuffer: DataView | null,
  byteOffset: number,
  options: GLTFWriterOptions
) {
  let gltfToEncode = gltf;
  if (!arrayBuffer) {
    encodeExtensions(gltf);
    const scenegraph = new GLTFScenegraph(gltf);
    scenegraph.createBinaryChunk();
    gltfToEncode = scenegraph.gltf;
  }
  convertBuffersToBase64(gltfToEncode);

  // TODO: Copy buffers to binary

  return encodeGLBSync(gltfToEncode, arrayBuffer, byteOffset, options);
}

function convertBuffersToBase64(gltf, {firstBuffer = 0} = {}) {
  if (gltf.buffers && gltf.buffers.length > firstBuffer + 1) {
    throw new Error(
      `encodeGLTF: multiple buffers not yet implemented, gltf.buffers.length=${gltf.buffers.length}, firstBuffer=${firstBuffer}`
    );
  }
}
