import {getImageMIMEType} from '@loaders.gl/images';
import assert from './utils/assert';
import {padTo4Bytes} from './utils/encode-utils';
import {getAccessorTypeFromSize, getComponentTypeFromArray} from './gltf-utils/gltf-type-utils';

// Class for structured access to GLTF data
export default class GLTFScenegraph {
  constructor(gltf) {
    // Signature: new GLTFScenegraph(data : GLTFScenegraph)
    // Allow utilities to create a GLTFScenegraph object from gltf data without checking
    if (gltf instanceof GLTFScenegraph) {
      return gltf;
    }

    if (!gltf) {
      gltf = {
        json: {
          version: 2,
          buffers: []
        },
        binary: null
      };
    }

    this.gltf = gltf;
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
    const object = this.gltf[array] && this.gltf[array][index];
    if (!object) {
      console.warn(`glTF file error: Could not find ${array}[${index}]`); // eslint-disable-line
    }
    return object;
  }

  getBufferViewArray(bufferViewIndex) {
    const bufferView = this.gltf.bufferViews[bufferViewIndex];
    if (this.glbParser) {
      return this.glbParser.getBufferView(bufferView);
    }

    const buffer = this.gltf.buffers[bufferView.buffer].data;
    const byteOffset = bufferView.byteOffset || 0;
    return new Uint8Array(buffer, byteOffset, bufferView.byteLength);
  }

  // MODIFERS

  // Add an extra application-defined key to the top-level data structure
  // By default packs JSON by extracting binary data and replacing it with JSON pointers
  addApplicationData(key, data) {
    this.json[key] = data;
    return this;
  }

  // `extras` - Standard GLTF field for storing application specific data
  // By default packs JSON by extracting binary data and replacing it with JSON pointers
  addExtraData(key, data) {
    this.json.extras = this.json.extras || {};
    this.json.extras[key] = data;
    return this;
  }

  // Add to standard GLTF top level extension object, mark as used
  // By default packs JSON by extracting binary data and replacing it with JSON pointers
  addExtension(extensionName, data) {
    assert(data);
    this.json.extensions = this.json.extensions || {};
    this.json.extensions[extensionName] = data;
    this.registerUsedExtension(extensionName);
    return this;
  }

  // Standard GLTF top level extension object, mark as used and required
  // By default packs JSON by extracting binary data and replacing it with JSON pointers
  addRequiredExtension(extensionName, data) {
    assert(data);
    this.addExtension(extensionName, data);
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
  }

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

    this.json.meshes = this.json.meshes || [];
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
    mimeType = mimeType || getImageMIMEType(imageData);

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
    const byteLength = buffer.byteLength || buffer.length;

    // We've now written the contents to the body, so update the total length
    // Every sub-chunk needs to be 4-byte aligned
    this.byteLength += padTo4Bytes(byteLength);

    // Add this buffer to the list of buffers to be written to the body.
    this.sourceBuffers = this.sourceBuffers || [];
    this.sourceBuffers.push(buffer);

    const glTFBufferView = {
      buffer: 0,
      // Write offset from the start of the binary body
      byteOffset: this.byteLength,
      byteLength
    };

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

  // _checkOptions(options) {
  //   // Warn if GLBBuilder options are used
  //   if ('packTypedArrays' in options || 'flattenArrays' in options) {
  //     // eslint-disable-next-line
  //     console.warn('packTypedArrays and flattenArrays options not supported');
  //   }
  // }
}
