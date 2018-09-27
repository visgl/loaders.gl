/* eslint-disable camelcase, max-statements */
import {getImageSize, padTo4Bytes, copyArrayBuffer, TextEncoder} from '../common/loader-utils';
import {DracoEncoder, DracoDecoder} from '../draco-encoder/draco-encoder';
import {getAccessorType, getAccessorComponentType} from './glb-accessor-utils';
import packBinaryJson from './pack-binary-json';

const MAGIC_glTF = 0x676c5446; // glTF in Big-Endian ASCII

const LE = true; // Binary GLTF is little endian.
const BE = false; // Magic needs to be written as BE

const GLB_FILE_HEADER_SIZE = 12;
const GLB_CHUNK_HEADER_SIZE = 8;

// Ideally we should just use KHR_draco_mesh_compression, but it requires saving uncompressed data?
const UBER_MESH_EXTENSION = 'UBER_draco_mesh_compression';
const UBER_POINT_CLOUD_EXTENSION = 'UBER_draco_point_cloud_compression';

export default class GLBBuilder {
  constructor(rootPath) {
    // Lets us keep track of how large the body will be, as well as the offset for each of the
    // original buffers.
    this.rootPath = rootPath;
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
  }

  getByteLength() {
    return this.byteLength;
  }

  // Returns an ArrayBuffer that represents the complete GLB image that can be saved to file
  encode(options = {}) {
    return this._createGlbBuffer(options);
  }

  // Returns an arrayBuffer together with JSON etc data.
  encodeWithMetadata(options = {}) {
    const arrayBuffer = this._createGlbBuffer(options);
    return {arrayBuffer, json: this.json};
  }

  // Packs JSON by extracting binary data and replacing it with JSON pointers
  packJSON(json, options) {
    return packBinaryJson(json, this, options);
  }

  // Standard GLTF field for storing application specific data
  addExtras(extras) {
    this.json.extras = extras;
    return this;
  }

  // Add to standard GLTF top level extension object, mark as used
  addExtension(extensionName, extension) {
    this.json.extensions = this.json.extensions || {};
    this.json.extensions[extensionName] = extension;
    this._registerUsedExtension(extensionName);
    return this;
  }

  // Standard GLTF top level extension object, mark as used and required
  addRequiredExtension(extensionName, extension) {
    this.addExtension(extensionName, extension);
    this._registerRequiredExtension(extensionName);
    return this;
  }

  // Add a binary buffer. Builds glTF "JSON metadata" and saves buffer reference
  // Buffer will be copied into BIN chunk during "pack"
  addBuffer(sourceBuffer, accessor = {size: 3}) {
    const bufferViewIndex = this._addBufferView(sourceBuffer);

    // Add an accessor pointing to the new buffer view
    const glTFAccessor = {
      bufferView: bufferViewIndex,
      type: getAccessorType(accessor.size),
      componentType: getAccessorComponentType(sourceBuffer),
      count: Math.round(sourceBuffer.length / accessor.size)
    };

    this.json.accessors.push(glTFAccessor);

    return this.json.accessors.length - 1;
  }

  // Checks if a binary buffer is a recognized image format (PNG, JPG, GIF, ...)
  isImage(imageData) {
    try {
      getImageSize(imageData);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Adds a binary image. Builds glTF "JSON metadata" and saves buffer reference
  // Buffer will be copied into BIN chunk during "pack"
  addImage(imageData) {
    const bufferViewIndex = this._addBufferView(imageData);

    const glTFImage = {
      bufferView: bufferViewIndex
    };

    // Get the properties of the image to add as metadata.
    const sizeAndType = getImageSize(imageData);
    if (sizeAndType) {
      const {mimeType, width, height} = sizeAndType;
      Object.assign(glTFImage, {mimeType, width, height});
    }

    this.json.images.push(glTFImage);

    return this.json.images.length - 1;
  }

  // POINTS:  0x0000,
  // LINES: 0x0001,
  // LINE_LOOP: 0x0002,
  // LINE_STRIP:  0x0003,
  // TRIANGLES: 0x0004,
  // TRIANGLE_STRIP:  0x0005,
  // TRIANGLE_FAN:  0x0006,

  addMesh(attributes, indices, mode = 4) {
    const accessors = this._addAttributes(attributes);

    const glTFMesh = {
      primitives: [
        {
          attributes: accessors,
          indices,
          mode
        }
      ]
    };

    this.json.meshes.push(glTFMesh);
    return this.json.meshes.length - 1;
  }

  addPointCloud(attributes) {
    const accessorIndices = this._addAttributes(attributes);

    const glTFMesh = {
      primitives: [
        {
          attributes: accessorIndices,
          mode: 0 // GL.POINTS
        }
      ]
    };

    this.json.meshes.push(glTFMesh);
    return this.json.meshes.length - 1;
  }

  // https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/
  //   KHR_draco_mesh_compression
  // NOTE: in contrast to glTF spec, does not add fallback data
  addCompressedMesh(attributes, mode = 4) {
    const dracoEncoder = new DracoEncoder();
    const compressedData = dracoEncoder.encodeMesh(attributes);

    // Draco compression may change the order and number of vertices in a mesh.
    // To satisfy the requirement that accessors properties be correct for both
    // compressed and uncompressed data, generators should create uncompressed
    // attributes and indices using data that has been decompressed from the Draco buffer,
    // rather than the original source data.
    const dracoDecoder = new DracoDecoder();
    const decodedData = dracoDecoder.decodeMesh(attributes);
    const fauxAccessors = this._addFauxAttributes(decodedData.attributes);

    const bufferViewIndex = this._addBufferView(compressedData);

    const glTFMesh = {
      primitives: [
        {
          attributes: fauxAccessors,
          mode, // GL.POINTS
          extensions: {
            [UBER_MESH_EXTENSION]: {
              bufferView: bufferViewIndex
            }
          }
        }
      ]
    };

    this._registerRequiredExtension(UBER_MESH_EXTENSION);

    this.json.meshes.push(glTFMesh);
    return this.json.meshes.length - 1;
  }

  addCompressedPointCloud(attributes) {
    const dracoEncoder = new DracoEncoder();
    const compressedData = dracoEncoder.encodePointCloud(attributes);

    // Draco compression may change the order and number of vertices in a mesh.
    // To satisfy the requirement that accessors properties be correct for both
    // compressed and uncompressed data, generators should create uncompressed
    // attributes and indices using data that has been decompressed from the Draco buffer,
    // rather than the original source data.
    const dracoDecoder = new DracoDecoder();
    const decodedData = dracoDecoder.decodePointCloud(compressedData);
    const fauxAccessors = this._addFauxAttributes(decodedData.attributes);

    const bufferViewIndex = this._addBufferView(compressedData);

    const glTFMesh = {
      primitives: [
        {
          attributes: fauxAccessors,
          mode: 0, // GL.POINTS
          extensions: {
            [UBER_POINT_CLOUD_EXTENSION]: {
              bufferView: bufferViewIndex
            }
          }
        }
      ]
    };

    this._registerRequiredExtension(UBER_POINT_CLOUD_EXTENSION);

    this.json.meshes.push(glTFMesh);
    return this.json.meshes.length - 1;
  }

  // For testing

  _pack() {
    this._packBinaryChunk();
    return {arrayBuffer: this.arrayBuffer, json: this.json};
  }

  /*
  copyToArrayBuffer(arrayBuffer, byteOffset) {
    for (const {offset, contents} of this.parts) {
      contents.copy(arrayBuffer, byteOffset + offset);
    }
  }
  */

  // PRIVATE

  _registerUsedExtension(extension) {
    this.json.extensionsUsed = this.json.extensionsUsed || [];
    if (!this.json.extensionsUsed.find(ext => ext === extension)) {
      this.json.extensionsUsed.push(extension);
    }
  }

  _registerRequiredExtension(extension) {
    this.json.extensionsRequired = this.json.extensionsRequired || [];
    this._registerUsedExtension(extension);
    if (!this.json.extensionsRequired.find(ext => ext === extension)) {
      this.json.extensionsRequired.push(extension);
    }
  }

  // Add one source buffer, create a matchibng glTF `bufferView`, and return its index
  _addBufferView(buffer) {
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
    let byteOffset = 0;
    for (let i = 0; i < this.sourceBuffers.length; i++) {
      const sourceBuffer = this.sourceBuffers[i];
      const byteLength = sourceBuffer.byteLength;

      // Pack buffer onto the big target array
      const sourceArray = new Uint8Array(sourceBuffer.buffer);
      targetArray.set(sourceArray, byteOffset);

      byteOffset += padTo4Bytes(byteLength);
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
  _createGlbBuffer(options = {}) {
    // TODO - avoid double array buffer creation
    this._packBinaryChunk();

    const binChunk = this.arrayBuffer;
    if (options.magic) {
      console.warn('Custom glTF magic number no longer supported'); // eslint-disable-line
    }

    const jsonChunkOffset = GLB_FILE_HEADER_SIZE + GLB_CHUNK_HEADER_SIZE; // First headers: 20 bytes

    const jsonChunk = convertObjectToJsonChunk(this.json);
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
}

function convertObjectToJsonChunk(json) {
  const jsonChunkString = JSON.stringify(json);
  const textEncoder = new TextEncoder('utf8');
  return textEncoder.encode(jsonChunkString);
}
