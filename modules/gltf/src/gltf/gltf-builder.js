/* eslint-disable camelcase, max-statements */
import GLBBuilder from '../glb/glb-builder';
import packBinaryJson from '../packed-json/pack-binary-json';
import {assert} from '@loaders.gl/core';

// Ideally we should just use KHR_draco_mesh_compression, but it requires saving uncompressed data?
const UBER_MESH_EXTENSION = 'UBER_draco_mesh_compression';
const UBER_POINT_CLOUD_EXTENSION = 'UBER_draco_point_cloud_compression';

export default class GLTFBuilder extends GLBBuilder {
  constructor(rootPath, options = {}) {
    super(rootPath, options);

    // Soft dependency on DRACO, app needs to import and supply these
    this.DracoEncoder = options.DracoEncoder;
    this.DracoDecoder = options.DracoDecoder;

    Object.assign(this.json, {
      meshes: []
    });
  }

  // Encode as a textual JSON file with binary data in base64 data URLs.
  // encodeAsDataURLs(options) {
  //   throw new Error('Not yet implemented');
  // }

  // Encode as a JSON with all images (and buffers?) in separate binary files
  // encodeAsSeparateFiles(options) {
  //   throw new Error('Not yet imlemented');
  // }

  // Add an extra application-defined key to the top-level data structure
  // By default packs JSON by extracting binary data and replacing it with JSON pointers
  addApplicationData(key, data, packOptions = {}) {
    const packedJson = !packOptions.nopack && packBinaryJson(data, this, packOptions);
    this.json[key] = packedJson;
    return this;
  }

  // `extras` - Standard GLTF field for storing application specific data
  // By default packs JSON by extracting binary data and replacing it with JSON pointers
  addExtraData(key, data, packOptions = {}) {
    const packedJson = !packOptions.nopack && packBinaryJson(data, this, packOptions);
    this.json.extras = this.json.extras || {};
    this.json.extras[key] = packedJson;
    return this;
  }

  // Add to standard GLTF top level extension object, mark as used
  // By default packs JSON by extracting binary data and replacing it with JSON pointers
  addExtension(extensionName, data, packOptions = {}) {
    assert(data);
    const packedJson = !packOptions.nopack && packBinaryJson(data, this, packOptions);
    this.json.extensions = this.json.extensions || {};
    this.json.extensions[extensionName] = packedJson;
    this.registerUsedExtension(extensionName);
    return this;
  }

  // Standard GLTF top level extension object, mark as used and required
  // By default packs JSON by extracting binary data and replacing it with JSON pointers
  addRequiredExtension(extensionName, data, packOptions = {}) {
    assert(data);
    const packedJson = !packOptions.nopack && packBinaryJson(data, this, packOptions);
    this.addExtension(extensionName, packedJson);
    this.registerRequiredExtension(extensionName);
    return this;
  }

  // Add extensionName to list of used extensions
  registerUsedExtension(extensionName) {
    this.json.extensionsUsed = this.json.extensionsUsed || [];
    if (!this.json.extensionsUsed.find(ext => ext === extensionName)) {
      this.json.extensionsUsed.push(extensionName);
    }
  }

  // Add extensionName to list of required extensions
  registerRequiredExtension(extensionName) {
    this.registerUsedExtension(extensionName);
    this.json.extensionsRequired = this.json.extensionsRequired || [];
    if (!this.json.extensionsRequired.find(ext => ext === extensionName)) {
      this.json.extensionsRequired.push(extensionName);
    }
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
  addCompressedMesh(attributes, indices, mode = 4) {
    if (!this.DracoEncoder || !this.DracoDecoder) {
      throw new Error('DracoEncoder/Decoder not available');
    }

    const dracoEncoder = new this.DracoEncoder();
    const compressedData = dracoEncoder.encodeMesh(attributes);

    // Draco compression may change the order and number of vertices in a mesh.
    // To satisfy the requirement that accessors properties be correct for both
    // compressed and uncompressed data, generators should create uncompressed
    // attributes and indices using data that has been decompressed from the Draco buffer,
    // rather than the original source data.
    const dracoDecoder = new this.DracoDecoder();
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

    this.registerRequiredExtension(UBER_MESH_EXTENSION);

    this.json.meshes.push(glTFMesh);
    return this.json.meshes.length - 1;
  }

  addCompressedPointCloud(attributes) {
    if (!this.DracoEncoder || !this.DracoDecoder) {
      throw new Error('DracoEncoder/Decoder not available');
    }

    const dracoEncoder = new this.DracoEncoder();

    const compressedData = dracoEncoder.encodePointCloud(attributes);

    // Draco compression may change the order and number of vertices in a mesh.
    // To satisfy the requirement that accessors properties be correct for both
    // compressed and uncompressed data, generators should create uncompressed
    // attributes and indices using data that has been decompressed from the Draco buffer,
    // rather than the original source data.
    const dracoDecoder = new this.DracoDecoder();
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

    this.registerRequiredExtension(UBER_POINT_CLOUD_EXTENSION);

    this.json.meshes.push(glTFMesh);
    return this.json.meshes.length - 1;
  }
}
