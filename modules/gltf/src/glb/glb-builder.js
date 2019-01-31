/* eslint-disable camelcase, max-statements */
import {
  isImage,
  getImageSize,
  padTo4Bytes,
  copyArrayBuffer,
  copyToArray,
  TextEncoder,
  getAccessorTypeFromSize,
  getComponentTypeFromArray
} from '@loaders.gl/core';

import packBinaryJson from '../packed-json/pack-binary-json';

const MAGIC_glTF = 0x676c5446; // glTF in Big-Endian ASCII

const LE = true; // Binary GLTF is little endian.
const BE = false; // Magic needs to be written as BE

const GLB_FILE_HEADER_SIZE = 12;
const GLB_CHUNK_HEADER_SIZE = 8;

export default class GLBBuilder {
  constructor(options = {}) {
    // Lets us keep track of how large the body will be, as well as the offset for each of the
    // original buffers.
    this.byteLength = 0;

    this.json = {
      buffers: [
        {
          // Just the single BIN chunk buffer
          byteLength: 0 // Updated at end of conversion
        }
      ],
      bufferViews: [],
      accessors: [],
      images: [],
      meshes: []
    };

    // list of binary buffers to be written to the BIN chunk
    // (Each call to addBuffer, addImage etc adds an entry here)
    this.sourceBuffers = [];

    this.log = options.log || console; // eslint-disable-line
  }

  // ACCESSORS

  getByteLength() {
    return this.byteLength;
  }

  // Checks if a binary buffer is a recognized image format (PNG, JPG, GIF, ...)
  isImage(imageData) {
    return isImage(imageData);
  }

  // MODIFERS

  // Encode the full glTF file as a binary GLB file
  // Returns an ArrayBuffer that represents the complete GLB image that can be saved to file
  encodeAsGLB(options = {}) {
    return this._createGLBBuffer(options);
  }

  // Add an extra application-defined key to the top-level data structure
  // By default packs JSON by extracting binary data and replacing it with JSON pointers
  addApplicationData(key, data, packOptions = {}) {
    const packedJson = !packOptions.nopack && packBinaryJson(data, this, packOptions);
    this.json[key] = packedJson;
    return this;
  }

  // Add a binary buffer. Builds glTF "JSON metadata" and saves buffer reference
  // Buffer will be copied into BIN chunk during "pack"
  // Currently encodes buffers as glTF accessors, but this could be optimized
  addBuffer(sourceBuffer, accessor = {}) {
    const bufferViewIndex = this.addBufferView(sourceBuffer);

    const accessorDefaults = {
      size: 3,
      componentType: getComponentTypeFromArray(sourceBuffer),
      count: Math.round(sourceBuffer.length / accessor.size)
    };

    return this.addAccessor(bufferViewIndex, Object.assign(accessorDefaults, accessor));
  }

  // Adds a binary image. Builds glTF "JSON metadata" and saves buffer reference
  // Buffer will be copied into BIN chunk during "pack"
  // Currently encodes as glTF image
  addImageData(imageData) {
    const bufferViewIndex = this.addBufferView(imageData);

    // Get the properties of the image to add as metadata.
    const sizeAndType = getImageSize(imageData) || {};
    if (sizeAndType) {
      const {mimeType, width, height} = sizeAndType;
      this.addImageObject(bufferViewIndex, {mimeType, width, height});
    } else {
      this.addImageObject(bufferViewIndex, {});
    }
  }

  // Basic glTF adders: basic memory buffer/image type fields
  // Scenegraph specific adders are placed in glTFBuilder

  // Add one untyped source buffer, create a matching glTF `bufferView`, and return its index
  addBufferView(buffer) {
    const byteLength = buffer.byteLength || buffer.length;

    // Add a bufferView indicating start and length of this binary sub-chunk
    this.json.bufferViews.push({
      buffer: 0,
      // Write offset from the start of the binary body
      byteOffset: this.byteLength,
      byteLength
    });

    // We've now written the contents to the body, so update the total length
    // Every sub-chunk needs to be 4-byte aligned
    this.byteLength += padTo4Bytes(byteLength);

    // Add this buffer to the list of buffers to be written to the body.
    this.sourceBuffers.push(buffer);

    // Return the index to the just created bufferView
    return this.json.bufferViews.length - 1;
  }

  // Adds an accessor to a bufferView
  addAccessor(bufferViewIndex, accessor) {
    // Add an accessor pointing to the new buffer view
    this.json.accessors.push({
      bufferView: bufferViewIndex,
      type: getAccessorTypeFromSize(accessor.size),
      componentType: accessor.componentType,
      count: accessor.count
    });

    return this.json.accessors.length - 1;
  }

  // Adds a binary image. Builds glTF "JSON metadata" and saves buffer reference
  // Buffer will be copied into BIN chunk during "pack"
  // TODO - this method should be renamed addImage
  addImage(bufferViewIndex, {mimeType, width, height}) {
    // DEPRECATED: We have renamed the addImage method, this is backwars compatibility
    if (ArrayBuffer.isView(bufferViewIndex)) {
      this.log.warn('GLBBuilder.addImage(): renamed to GLBBuilder.addImageData()');
      return this.addImage(...arguments);
    }

    this.json.images.push({
      bufferView: bufferViewIndex,
      mimeType,
      width,
      height
    });

    return this.json.images.length - 1;
  }

  // PRIVATE

  // For testing
  _pack() {
    this._packBinaryChunk();
    return {arrayBuffer: this.arrayBuffer, json: this.json};
  }

  // Pack the binary chunk
  _packBinaryChunk() {
    // Already packed
    if (this.arrayBuffer) {
      return;
    }

    // Allocate total array
    const totalByteLength = this.byteLength;
    const arrayBuffer = new ArrayBuffer(totalByteLength);
    const targetArray = new Uint8Array(arrayBuffer);

    // Copy each array into
    let dstByteOffset = 0;
    for (let i = 0; i < this.sourceBuffers.length; i++) {
      const sourceBuffer = this.sourceBuffers[i];
      dstByteOffset = copyToArray(sourceBuffer, targetArray, dstByteOffset);
    }

    // Update the glTF BIN CHUNK byte length
    this.json.buffers[0].byteLength = totalByteLength;

    // Save generated arrayBuffer
    this.arrayBuffer = arrayBuffer;

    // Clear out sourceBuffers
    this.sourceBuffers = [];
  }

  // Encode the full GLB buffer with header etc
  // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#
  // glb-file-format-specification
  _createGLBBuffer(options = {}) {
    // TODO - avoid double array buffer creation
    this._packBinaryChunk();

    const binChunk = this.arrayBuffer;
    if (options.magic) {
      console.warn('Custom glTF magic number no longer supported'); // eslint-disable-line
    }

    const jsonChunkOffset = GLB_FILE_HEADER_SIZE + GLB_CHUNK_HEADER_SIZE; // First headers: 20 bytes

    const jsonChunk = this._convertObjectToJsonChunk(this.json);
    // As body is 4-byte aligned, the scene length must be padded to have a multiple of 4.
    const jsonChunkLength = padTo4Bytes(jsonChunk.byteLength);

    const binChunkOffset = jsonChunkLength + jsonChunkOffset;
    const fileLength = binChunkOffset + GLB_CHUNK_HEADER_SIZE + padTo4Bytes(binChunk.byteLength);

    // Length is know, we can create the GLB memory buffer!
    const glbArrayBuffer = new ArrayBuffer(fileLength);
    const dataView = new DataView(glbArrayBuffer);

    // GLB Header
    dataView.setUint32(0, MAGIC_glTF, BE); // Magic number (the ASCII string 'glTF').
    dataView.setUint32(4, 2, LE); // Version 2 of binary glTF container format uint32
    dataView.setUint32(8, fileLength, LE); // Total byte length of generated file (uint32)

    // Write the JSON chunk
    dataView.setUint32(12, jsonChunk.byteLength, LE); // Byte length of json chunk (uint32)
    dataView.setUint32(16, 0, LE); // Chunk format as uint32 (JSON is 0)
    copyArrayBuffer(glbArrayBuffer, jsonChunk, jsonChunkOffset);

    // TODO - Add spaces as padding to ensure scene is a multiple of 4 bytes.
    // for (let i = jsonChunkLength + 20; i < binChunkOffset; ++i) {
    //   glbFileArray[i] = 0x20;
    // }

    // Write the BIN chunk
    const binChunkLengthPadded = padTo4Bytes(binChunk.byteLength);
    dataView.setUint32(binChunkOffset + 0, binChunkLengthPadded, LE); // Byte length BIN (uint32)
    dataView.setUint32(binChunkOffset + 4, 1, LE); // Chunk format as uint32 (BIN is 1)
    copyArrayBuffer(glbArrayBuffer, binChunk, binChunkOffset + GLB_CHUNK_HEADER_SIZE);

    return glbArrayBuffer;
  }

  // Report internal buffer sizes for debug and testing purposes
  _getInternalCounts() {
    return {
      buffers: this.json.buffers.length,
      bufferViews: this.json.bufferViews.length,
      accessors: this.json.accessors.length,
      images: this.json.images.length
    };
  }

  _convertObjectToJsonChunk(json) {
    const jsonChunkString = JSON.stringify(json);
    const textEncoder = new TextEncoder('utf8');
    return textEncoder.encode(jsonChunkString);
  }
}

