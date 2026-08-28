// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {encodeGLTFSync} from './lib/encoders/encode-gltf';
import type {GLTFWithBuffers} from './lib/types/gltf-types';
import {compressGLTFWithDraco, type GLTFDracoWriterOptions} from './lib/encoders/encode-gltf-draco';
import {encodeExtensions} from './lib/api/gltf-extensions';
import {GLTFFormat} from './gltf-format';

export type GLTFWriterOptions = WriterOptions & {
  gltf?: {
    /** Optional glTF-specific encoding features. */
    draco?: GLTFDracoWriterOptions;
  };
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

  encode: async (gltf: GLTFWithBuffers, options: GLTFWriterOptions = {}) => {
    const compressed = await compressGLTFWithDraco(gltf, options);
    const encodeOptions = {...options};
    encodeOptions.gltf = options.gltf ? {...options.gltf, draco: undefined} : undefined;
    return encodeSync(compressed, encodeOptions);
  },
  encodeSync
} as WriterWithEncoder<any, never, GLTFWriterOptions>;

function encodeSync(gltf: GLTFWithBuffers, options: GLTFWriterOptions = {}) {
  if (options.gltf?.draco?.enabled) {
    throw new Error(
      'GLTFWriter Draco compression is asynchronous; use encode() instead of encodeSync()'
    );
  }
  const {byteOffset = 0} = options;
  const gltfToEncode = encodeExtensions(gltf);

  // Calculate length, then create arraybuffer and encode
  const byteLength = encodeGLTFSync(gltfToEncode, null, byteOffset, options);
  const arrayBuffer = new ArrayBuffer(byteLength);
  const dataView = new DataView(arrayBuffer);
  encodeGLTFSync(gltfToEncode, dataView, byteOffset, options);

  return arrayBuffer;
}
