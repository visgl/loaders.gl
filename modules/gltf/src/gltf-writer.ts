import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {encodeGLTFSync} from './lib/encoders/encode-gltf';
import {GLTFWithBuffers} from '@loaders.gl/gltf';
import {encodeExtensions} from './lib/api/gltf-extensions';
import {GLTFFormat} from './gltf-format';

export type GLTFWriterOptions = WriterOptions & {
  gltf?: {};
  byteOffset?: number;
};

/**
 * GLTF exporter
 */
export const GLTFWriter = {
  dataType: null as unknown as any,
  batchType: null as never,

  ...GLTFFormat,
  version: VERSION,
  options: {
    gltf: {}
  },

  encode: async (gltf: GLTFWithBuffers, options: GLTFWriterOptions = {}) =>
    encodeSync(gltf, options),
  encodeSync
} as WriterWithEncoder<any, never, GLTFWriterOptions>;

function encodeSync(gltf: GLTFWithBuffers, options: GLTFWriterOptions = {}) {
  const {byteOffset = 0} = options;
  const gltfToEncode = encodeExtensions(gltf);

  // Calculate length, then create arraybuffer and encode
  const byteLength = encodeGLTFSync(gltfToEncode, null, byteOffset, options);
  const arrayBuffer = new ArrayBuffer(byteLength);
  const dataView = new DataView(arrayBuffer);
  encodeGLTFSync(gltfToEncode, dataView, byteOffset, options);

  return arrayBuffer;
}
