import {getBinaryImageMIMEType} from '@loaders.gl/images';
import {padTo4Bytes, copyToArray} from '@loaders.gl/loader-utils';
import assert from './utils/assert';
import {
  getAccessorArrayTypeAndLength,
  getAccessorTypeFromSize,
  getComponentTypeFromArray
} from './gltf-utils/gltf-utils';

// Class for structured access to GLTF data
export default class GLTFScenegraph {
  // eslint-disable-next-line consistent-return
  constructor(gltf) {
    // Signature: new GLTFScenegraph(data : GLTFScenegraph)
    // Allow creation of a `GLTFScenegraph` object from gltf data without checking if already a `GLTFScenegraph`
    if (gltf instanceof GLTFScenegraph) {
      return gltf;
    }

    if (!gltf) {
      gltf = {
        json: {
          version: 2,
          buffers: []
        },
        buffers: []
      };
    }

    this.byteLength = 0;
    // TODO - this is too sloppy, define inputs more clearly
    this.gltf = gltf;
    assert(this.gltf.json);
  }

  // Accessors

  get json() {
    return this.gltf.json;
  }

  getApplicationData(key) {
    // TODO - Data is already unpacked by GLBParser
    const data = this.json[key];
    return data;
  }

  getExtraData(key) {
    // TODO - Data is already unpacked by GLBParser
    const extras = this.json.extras || {};
    return extras[key];
  }

  getExtension(extensionName) {
    const isExtension = this.getUsedExtensions().find(name => name === extensionName);
    const extensions = this.json.extensions || {};
    return isExtension ? extensions[extensionName] || true : null;
  }

  getRequiredExtension(extensionName) {
    const isRequired = this.getRequiredExtensions().find(name => name === extensionName);
    return isRequired ? this.getExtension(extensionName) : null;
  }

  getRequiredExtensions() {
    return this.json.extensionsRequired || [];
  }

  getUsedExtensions() {
    return this.json.extensionsUsed || [];
  }

  getObjectExtension(object, extensionName) {
    const extensions = object.extensions || {};
    return extensions[extensionName];
  }

  getScene(index) {
    return this.getObject('scenes', index);
  }

  getNode(index) {
    return this.getObject('nodes', index);
  }

  getSkin(index) {
    return this.getObject('skins', index);
  }

  getMesh(index) {
    return this.getObject('meshes', index);
  }

  getMaterial(index) {
    return this.getObject('materials', index);
  }

  getAccessor(index) {
    return this.getObject('accessors', index);
  }

  getCamera(index) {
    return null; // TODO: fix this
  }

  getTexture(index) {
    return this.getObject('textures', index);
  }

  getSampler(index) {
    return this.getObject('samplers', index);
  }

  getImage(index) {
    return this.getObject('images', index);
  }

  getBufferView(index) {
    return this.getObject('bufferViews', index);
  }

  getBuffer(index) {
    return this.getObject('buffers', index);
  }

  getObject(array, index) {
    // check if already resolved
    if (typeof index === 'object') {
      return index;
    }
    const object = this.json[array] && this.json[array][index];
    if (!object) {
      throw new Error(`glTF file error: Could not find ${array}[${index}]`); // eslint-disable-line
    }
    return object;
  }

  // accepts buffer view index or buffer view object
  // returns a `Uint8Array`
  getTypedArrayForBufferView(bufferView) {
    bufferView = this.getBufferView(bufferView);
    const bufferIndex = bufferView.buffer;

    // Get hold of the arrayBuffer
    // const buffer = this.getBuffer(bufferIndex);
    const binChunk = this.gltf.buffers[bufferIndex];
    assert(binChunk);

    const byteOffset = (bufferView.byteOffset || 0) + binChunk.byteOffset;
    return new Uint8Array(binChunk.arrayBuffer, byteOffset, bufferView.byteLength);
  }

  // accepts accessor index or accessor object
  // returns a typed array with type that matches the types
  getTypedArrayForAccessor(accessor) {
    accessor = this.getAccessor(accessor);
    const bufferView = this.getBufferView(accessor.bufferView);
    const buffer = this.getBuffer(bufferView.buffer);
    const arrayBuffer = buffer.data;

    // Create a new typed array as a view into the combined buffer
    const {ArrayType, length} = getAccessorArrayTypeAndLength(accessor, bufferView);
    const byteOffset = bufferView.byteOffset + accessor.byteOffset;
    return new ArrayType(arrayBuffer, byteOffset, length);
  }

  // accepts accessor index or accessor object
  // returns a `Uint8Array`
  getTypedArrayForImageData(image) {
    image = this.getAccessor(image);
    const bufferView = this.getBufferView(image.bufferView);
    const buffer = this.getBuffer(bufferView.buffer);
    const arrayBuffer = buffer.data;

    const byteOffset = bufferView.byteOffset || 0;
    return new Uint8Array(arrayBuffer, byteOffset, bufferView.byteLength);
  }

  // MODIFERS

  // Add an extra application-defined key to the top-level data structure
  addApplicationData(key, data) {
    this.json[key] = data;
    return this;
  }

  // `extras` - Standard GLTF field for storing application specific data
  addExtraData(key, data) {
    this.json.extras = this.json.extras || {};
    this.json.extras[key] = data;
    return this;
  }

  addObjectExtension(object, extensionName, data) {
    assert(data);
    object.extensions = object.extensions || {};
    // TODO - clobber or merge?
    object.extensions[extensionName] = data;
    this.registerUsedExtension(extensionName);
    return this;
  }

  removeObjectExtension(object, extensionName) {
    const extensions = object.extensions || {};
    delete extensions[extensionName];
    return this;
  }

  // Add to standard GLTF top level extension object, mark as used
  addExtension(extensionName, extensionData = {}) {
    assert(extensionData);
    this.json.extensions = this.json.extensions || {};
    this.json.extensions[extensionName] = extensionData;
    this.registerUsedExtension(extensionName);
    return extensionData;
  }

  // Standard GLTF top level extension object, mark as used and required
  addRequiredExtension(extensionName, extensionData = {}) {
    assert(extensionData);
    this.addExtension(extensionName, extensionData);
    this.registerRequiredExtension(extensionName);
    return extensionData;
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

  // Removes an extension from the top-level list
  removeExtension(extensionName) {
    if (this.json.extensionsRequired) {
      this._removeStringFromArray(this.json.extensionsRequired, extensionName);
    }
    if (this.json.extensionsUsed) {
      this._removeStringFromArray(this.json.extensionsUsed, extensionName);
    }
    if (this.json.extensions) {
      delete this.json.extensions[extensionName];
    }
  }

  setObjectExtension(object, extensionName, data) {
    const extensions = object.extensions || {};
    extensions[extensionName] = data;
    // TODO - add to usedExtensions...
  }

  addMesh(attributes, indices, mode = 4) {
    // @ts-ignore
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

    this.json.meshes = this.json.meshes || [];
    this.json.meshes.push(glTFMesh);
    return this.json.meshes.length - 1;
  }

  addPointCloud(attributes) {
    // @ts-ignore
    const accessorIndices = this._addAttributes(attributes);

    const glTFMesh = {
      primitives: [
        {
          attributes: accessorIndices,
          mode: 0 // GL.POINTS
        }
      ]
    };

    this.json.meshes = this.json.meshes || [];
    this.json.meshes.push(glTFMesh);
    return this.json.meshes.length - 1;
  }

  // Adds a binary image. Builds glTF "JSON metadata" and saves buffer reference
  // Buffer will be copied into BIN chunk during "pack"
  // Currently encodes as glTF image
  addImage(imageData, mimeType) {
    // If image is referencing a bufferView instead of URI, mimeType must be defined:
    //   https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#images
    //   "a reference to a bufferView; in that case mimeType must be defined."
    mimeType = mimeType || getBinaryImageMIMEType(imageData);

    const bufferViewIndex = this.addBufferView(imageData);

    const glTFImage = {
      bufferView: bufferViewIndex,
      mimeType
    };

    this.json.images = this.json.images || [];
    this.json.images.push(glTFImage);
    return this.json.images.length - 1;
  }

  // Add one untyped source buffer, create a matching glTF `bufferView`, and return its index
  addBufferView(buffer) {
    const byteLength = buffer.byteLength;
    assert(Number.isFinite(byteLength));

    // Add this buffer to the list of buffers to be written to the body.
    this.sourceBuffers = this.sourceBuffers || [];
    this.sourceBuffers.push(buffer);

    const glTFBufferView = {
      buffer: 0,
      // Write offset from the start of the binary body
      byteOffset: this.byteLength,
      byteLength
    };

    // We've now added the contents to the body, so update the total length
    // Every sub-chunk needs to be 4-byte align ed
    this.byteLength += padTo4Bytes(byteLength);

    // Add a bufferView indicating start and length of this binary sub-chunk
    this.json.bufferViews = this.json.bufferViews || [];
    this.json.bufferViews.push(glTFBufferView);
    return this.json.bufferViews.length - 1;
  }

  // Adds an accessor to a bufferView
  addAccessor(bufferViewIndex, accessor) {
    const glTFAccessor = {
      bufferView: bufferViewIndex,
      type: getAccessorTypeFromSize(accessor.size),
      componentType: accessor.componentType,
      count: accessor.count
    };

    this.json.accessors = this.json.accessors || [];
    this.json.accessors.push(glTFAccessor);
    return this.json.accessors.length - 1;
  }

  // Add a binary buffer. Builds glTF "JSON metadata" and saves buffer reference
  // Buffer will be copied into BIN chunk during "pack"
  // Currently encodes buffers as glTF accessors, but this could be optimized
  addBinaryBuffer(sourceBuffer, accessor = {size: 3}) {
    const bufferViewIndex = this.addBufferView(sourceBuffer);

    const accessorDefaults = {
      size: accessor.size,
      componentType: getComponentTypeFromArray(sourceBuffer),
      count: Math.round(sourceBuffer.length / accessor.size)
    };

    return this.addAccessor(bufferViewIndex, Object.assign(accessorDefaults, accessor));
  }

  // Pack the binary chunk
  createBinaryChunk() {
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

  // PRIVATE

  _removeStringFromArray(array, string) {
    let found = true;
    while (found) {
      const index = array.indexOf(string);
      if (index > -1) {
        array.splice(index, 1);
      } else {
        found = false;
      }
    }
  }
}
