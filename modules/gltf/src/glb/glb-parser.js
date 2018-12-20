/* eslint-disable camelcase, max-statements */
import unpackGLBBuffers from './unpack-glb-buffers';
import unpackBinaryJson from '../packed-json/unpack-binary-json';

import {TextDecoder, padTo4Bytes, assert} from '@loaders.gl/core';
import {
  ATTRIBUTE_TYPE_TO_COMPONENTS,
  ATTRIBUTE_COMPONENT_TYPE_TO_BYTE_SIZE,
  ATTRIBUTE_COMPONENT_TYPE_TO_ARRAY
} from '../utils/gltf-type-utils';

const MAGIC_glTF = 0x676c5446; // glTF in Big-Endian ASCII

const GLB_FILE_HEADER_SIZE = 12;
const GLB_CHUNK_HEADER_SIZE = 8;

const GLB_CHUNK_TYPE_JSON = 0x4E4F534A;
const GLB_CHUNK_TYPE_BIN = 0x004E4942;

const LE = true; // Binary GLTF is little endian.
const BE = false; // Magic needs to be written as BE

function getMagicString(dataView) {
  return `\
${String.fromCharCode(dataView.getUint8(0))}\
${String.fromCharCode(dataView.getUint8(1))}\
${String.fromCharCode(dataView.getUint8(2))}\
${String.fromCharCode(dataView.getUint8(3))}`;
}

// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification
export default class GLBParser {

  static isGLB(glbArrayBuffer, options = {}) {
    const {magic = MAGIC_glTF} = options;

    // Check that GLB Header starts with the magic number
    const dataView = new DataView(glbArrayBuffer);
    const magic1 = dataView.getUint32(0, BE);
    return magic1 === magic || magic1 === MAGIC_glTF;
  }

  constructor(glbArrayBuffer, options = {}) {
    // Soft dependency on Draco, needs to be imported and supplied by app
    this.DracoDecoder = options.DracoDecoder;

    // Input
    this.glbArrayBuffer = glbArrayBuffer;

    // Result
    this.binaryByteOffset = null;
    this.packedJson = null;
    this.json = null;
  }

  // Return the gltf JSON and the original arrayBuffer
  parse(options = {}) {
    // Only parse once
    if (this.json === null && this.binaryByteOffset === null) {
      this.result = this._parse(options);
    }
    return this;
  }

  // Returns application JSON data stored in `key`
  getApplicationData(key) {
    return this.json[key];
  }

  // Returns JSON envelope
  getJSON() {
    return this.json;
  }

  // Return binary chunk
  getArrayBuffer() {
    return this.glbArrayBuffer;
  }

  // Return index into binary chunk
  getBinaryByteOffset() {
    return this.binaryByteOffset;
  }

  // PRIVATE

  _parse(options) {
    const result = this._parseBinary(options);
    this.packedJson = result.json;
    this.unpackedBuffers =
      unpackGLBBuffers(this.glbArrayBuffer, this.json, this.binaryByteOffset);
    this.json = unpackBinaryJson(this.json, this.unpackedBuffers);
  }

  _parseBinary(options) {
    const {magic = MAGIC_glTF} = options;

    // GLB Header
    const dataView = new DataView(this.glbArrayBuffer);
    const magic1 = dataView.getUint32(0, BE); // Magic number (the ASCII string 'glTF').
    const version = dataView.getUint32(4, LE); // Version 2 of binary glTF container format
    const fileLength = dataView.getUint32(8, LE); // Total byte length of generated file

    let valid = magic1 === MAGIC_glTF || magic1 === magic;
    if (!valid) {
      console.warn(`Invalid GLB magic string ${getMagicString(dataView)}`); // eslint-disable-line
    }

    assert(version === 2, `Invalid GLB version ${version}. Only .glb v2 supported`);
    assert(fileLength > 20);

    // Write the JSON chunk
    const jsonChunkLength = dataView.getUint32(12, LE); // Byte length of json chunk
    const jsonChunkFormat = dataView.getUint32(16, LE); // Chunk format as uint32

    valid = jsonChunkFormat === GLB_CHUNK_TYPE_JSON || jsonChunkFormat === 0; // Back compat
    assert(valid, `JSON chunk format ${jsonChunkFormat}`);

    // Create a "view" of the binary encoded JSON data
    const jsonChunkOffset = GLB_FILE_HEADER_SIZE + GLB_CHUNK_HEADER_SIZE; // First headers: 20 bytes
    const jsonChunk = new Uint8Array(this.glbArrayBuffer, jsonChunkOffset, jsonChunkLength);

    // Decode the JSON binary array into clear text
    const textDecoder = new TextDecoder('utf8');
    const jsonText = textDecoder.decode(jsonChunk);

    // Parse the JSON text into a JavaScript data structure
    this.json = JSON.parse(jsonText);

    // TODO - BIN chunk can be optional
    const binaryChunkStart = jsonChunkOffset + padTo4Bytes(jsonChunkLength);
    this.binaryByteOffset = binaryChunkStart + GLB_CHUNK_HEADER_SIZE;

    const binChunkFormat = dataView.getUint32(binaryChunkStart + 4, LE); // Chunk format as uint32
    valid = binChunkFormat === GLB_CHUNK_TYPE_BIN || binChunkFormat === 1; // Back compat
    assert(valid, `BIN chunk format ${binChunkFormat}`);

    return {
      arrayBuffer: this.glbArrayBuffer,
      binaryByteOffset: this.binaryByteOffset,
      json: this.json
    };
  }

  unpackBinaryObjects() {
    const unpackedBinaryObjects = {
      images: [],
      accessors: [],
      meshes: []
    };

    const images = this.json.images || [];
    for (const glTFImage of images) {
      unpackedBinaryObjects.images.push(this._unpackImage(glTFImage));
    }

    const accessors = this.json.accessors || [];
    for (const glTFAccessor of accessors) {
      unpackedBinaryObjects.accessors.push(this._unpackAccessor(glTFAccessor));
    }

    const meshes = this.json.meshes || [];
    for (const glTFMesh of meshes) {
      unpackedBinaryObjects.meshes.push(this._unpackMesh(glTFMesh));
    }

    return unpackedBinaryObjects;
  }

  _unpackImage(glTFImage) {
    /* global window, Blob, Image */
    const arrayBufferView = this.unpackBufferView(glTFImage.bufferView);
    const mimeType = glTFImage.mimeType || 'image/jpeg';
    const blob = new Blob([arrayBufferView], {type: mimeType});
    const urlCreator = window.URL || window.webkitURL;
    const imageUrl = urlCreator.createObjectURL(blob);
    const img = new Image();
    img.src = imageUrl;
    return img;
  }

  _unpackAccessor(glTFAccessor) {
    // Decode the glTF accessor format
    const ArrayType = ATTRIBUTE_COMPONENT_TYPE_TO_ARRAY[glTFAccessor.componentType];
    const components = ATTRIBUTE_TYPE_TO_COMPONENTS[glTFAccessor.type];
    const bytesPerComponent = ATTRIBUTE_COMPONENT_TYPE_TO_BYTE_SIZE[glTFAccessor.componentType];
    const length = glTFAccessor.count * components;
    const byteLength = glTFAccessor.count * components * bytesPerComponent;

    // Get the boundaries of the binary sub-chunk for this bufferView
    const glTFBufferView = this.json.bufferViews[glTFAccessor.bufferView];
    assert(byteLength >= 0 && byteLength <= glTFBufferView.byteLength);

    const byteOffset = glTFBufferView.byteOffset + this.binaryByteOffset;
    return new ArrayType(this.arrayBuffer, byteOffset, length);
  }

  // Create a new typed array as a view into the binary chunk
  _unpackBufferView(glTFBufferView) {
    const byteOffset = glTFBufferView.byteOffset + this.binaryByteOffset;
    return new Uint8Array(byteOffset, glTFBufferView.byteLength);
  }

  _unpackMesh(mesh) {
    const unpackedPrimitives = [];

    for (const primitive of mesh.primitives) {

      const compressedMesh =
        primitive.extensions && primitive.extensions.UBER_draco_mesh_compression;
      const compressedPointCloud =
        primitive.extensions && primitive.extensions.UBER_draco_point_cloud_compression;

      const unpackedPrimitive = {
        mode: primitive.mode,
        material: primitive.material
      };

      if (compressedMesh) {
        const dracoDecoder = new this.DracoDecoder();
        const decodedData = dracoDecoder.decodeMesh(compressedMesh);
        dracoDecoder.destroy();

        Object.assign(unpackedPrimitive, {
          indices: decodedData.indices,
          attributes: decodedData.attributes
        });

      } else if (compressedPointCloud) {
        const dracoDecoder = new this.DracoDecoder();
        const decodedData = dracoDecoder.decodePointCloud(compressedPointCloud);
        dracoDecoder.destroy();

        Object.assign(unpackedPrimitive, {
          mode: 0,
          attributes: decodedData.attributes
        });
      } else {
        // No compression - just a glTF mesh primitive
        // TODO - Resolve all accessors
      }

      unpackedPrimitives.push(unpackedPrimitive);
    }

    return unpackedPrimitives.length === 1 ? unpackedPrimitives[0] : unpackedPrimitives;
  }
}
