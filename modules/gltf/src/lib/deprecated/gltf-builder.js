// @ts-nocheck
import {getBinaryImageMIMEType, getBinaryImageSize} from '@loaders.gl/images';
import assert from '../utils/assert';
import {UBER_POINT_CLOUD_EXTENSION} from '../gltf-constants';
import GLBBuilder from './glb-builder';

function packBinaryJson(data, builder, packOptions) {
  assert(!packOptions.packTypedArrays);
  return data;
}

export default class GLTFBuilder extends GLBBuilder {
  constructor(options = {}) {
    super(options);

    // Soft dependency on DRACO, app needs to import and supply these
    this.DracoWriter = options.DracoWriter;
    this.DracoLoader = options.DracoLoader;
  }

  // NOTE: encode() inherited from GLBBuilder

  // TODO - support encoding to non-GLB versions of glTF format
  // Encode as a textual JSON file with binary data in base64 data URLs.
  // encodeAsDataURLs(options)
  // Encode as a JSON with all images (and buffers?) in separate binary files
  // encodeAsSeparateFiles(options)

  // Add an extra application-defined key to the top-level data structure
  // By default packs JSON by extracting binary data and replacing it with JSON pointers
  addApplicationData(key, data, packOptions = {}) {
    const jsonData = packOptions.packTypedArrays ? packBinaryJson(data, this, packOptions) : data;
    this.json[key] = jsonData;
    return this;
  }

  // `extras` - Standard GLTF field for storing application specific data
  // By default packs JSON by extracting binary data and replacing it with JSON pointers
  addExtraData(key, data, packOptions = {}) {
    const packedJson = packOptions.packedTypedArrays
      ? packBinaryJson(data, this, packOptions)
      : data;
    this.json.extras = this.json.extras || {};
    this.json.extras[key] = packedJson;
    return this;
  }

  // Add to standard GLTF top level extension object, mark as used
  // By default packs JSON by extracting binary data and replacing it with JSON pointers
  addExtension(extensionName, data, packOptions = {}) {
    assert(data);
    const packedJson = packOptions.packTypedArrays ? packBinaryJson(data, this, packOptions) : data;
    this.json.extensions = this.json.extensions || {};
    this.json.extensions[extensionName] = packedJson;
    this.registerUsedExtension(extensionName);
    return this;
  }

  // Standard GLTF top level extension object, mark as used and required
  // By default packs JSON by extracting binary data and replacing it with JSON pointers
  addRequiredExtension(extensionName, data, packOptions = {}) {
    assert(data);
    const packedJson = packOptions.packTypedArrays ? packBinaryJson(data, this, packOptions) : data;
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

  // mode:
  // POINTS:  0x0000,
  // LINES: 0x0001,
  // LINE_LOOP: 0x0002,
  // LINE_STRIP:  0x0003,
  // TRIANGLES: 0x0004,
  // TRIANGLE_STRIP:  0x0005,
  // TRIANGLE_FAN:  0x0006,

  addMesh(attributes, indices, mode = 4) {
    assert(false);
    return -1;
  }

  addPointCloud(attributes) {
    assert(false);
    return -1;
  }

  // eslint-disable-next-line max-len
  // https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
  // Only TRIANGLES: 0x0004 and TRIANGLE_STRIP: 0x0005 are supported
  addCompressedMesh(attributes, indices, mode = 4) {
    assert(false);
    return -1;
  }

  addCompressedPointCloud(attributes) {
    if (!this.DracoWriter || !this.DracoLoader) {
      throw new Error('DracoWriter/DracoLoader not available');
    }

    attributes.mode = 0;
    const compressedData = this.DracoWriter.encodeSync(attributes, {draco: {pointcloud: true}});

    const bufferViewIndex = this.addBufferView(compressedData);

    const glTFMesh = {
      primitives: [
        {
          attributes: {}, // This will be populated after decompression
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

    this.json.meshes = this.json.meshes || [];
    this.json.meshes.push(glTFMesh);
    return this.json.meshes.length - 1;
  }

  // Adds a binary image. Builds glTF "JSON metadata" and saves buffer reference
  // Buffer will be copied into BIN chunk during "pack"
  // Currently encodes as glTF image
  addImage(imageData) {
    const bufferViewIndex = this.addBufferView(imageData);

    // Get the properties of the image to add as metadata.
    const mimeType = getBinaryImageMIMEType(imageData) || {};
    if (mimeType) {
      const {width, height} = getBinaryImageSize(imageData, mimeType) || {};
      this.json.images.push({
        bufferView: bufferViewIndex,
        mimeType,
        width,
        height
      });
    } else {
      // TODO: Spec violation, if we are using a bufferView, mimeType must be defined:
      //   https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#images
      //   "a reference to a bufferView; in that case mimeType must be defined."
      this.json.images.push({
        bufferView: bufferViewIndex
      });
    }

    return this.json.images.length - 1;
  }
}
