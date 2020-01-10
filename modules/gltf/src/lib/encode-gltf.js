/*
import {assert} from '@loaders.gl/core';
import {getImageSize} from '@loaders.gl/images';
import {isImage} from '@loaders.gl/images';

import {getAccessorTypeFromSize, getComponentTypeFromArray} from './gltf-utils/gltf-utils';
import {KHR_DRACO_MESH_COMPRESSION, UBER_POINT_CLOUD_EXTENSION} from './gltf-constants';

const DEFAULT_GTLF = {
  buffers: [],
  bufferViews: [],
  accessors: [],
  images: [],
  meshes: []
};
*/

import encodeGLBSync from './encode-glb';

// Encode the full glTF file as a binary GLB file
// Returns an ArrayBuffer that represents the complete GLB image that can be saved to file
//
// TODO - Does not support encoding to non-GLB versions of glTF format
// - Encode as a textual JSON file with binary data in base64 data URLs.
// - Encode as a JSON with all images (and buffers?) in separate binary files
//
// glb-file-format-specification
// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#

export function encodeGLTFSync(gltf, arrayBuffer, byteOffset, options) {
  convertBuffersToBase64(gltf);

  // TODO: Copy buffers to binary

  return encodeGLBSync(gltf, arrayBuffer, byteOffset, options);
}

function convertBuffersToBase64(gltf, {firstBuffer = 0} = {}) {
  if (gltf.buffers && gltf.buffers.length > firstBuffer) {
    throw new Error('encodeGLTF: multiple buffers not yet implemented');
  }
}
