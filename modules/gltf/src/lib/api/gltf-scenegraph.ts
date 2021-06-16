import type {
  GLTF,
  GLTFScene,
  GLTFNode,
  GLTFMesh,
  GLTFSkin,
  GLTFMaterial,
  GLTFAccessor,
  GLTFSampler,
  GLTFTexture,
  GLTFImage,
  GLTFBuffer,
  GLTFBufferView
} from '../types/gltf-types';

import {getBinaryImageMetadata} from '@loaders.gl/images';
import {padToNBytes, copyToArray} from '@loaders.gl/loader-utils';
import {assert} from '../utils/assert';
import {
  getAccessorArrayTypeAndLength,
  getAccessorTypeFromSize,
  getComponentTypeFromArray
} from '../gltf-utils/gltf-utils';

type GLTFWithBuffers = {
  json: GLTF;
  buffers: any[];
  binary?: ArrayBuffer;
};

const DEFAULT_GLTF_JSON: GLTF = {
  asset: {
    version: '2.0',
    generator: 'loaders.gl'
  },
  buffers: []
};

/**
 * Class for structured access to GLTF data
 */
export default class GLTFScenegraph {
  // internal
  gltf: GLTFWithBuffers;
  sourceBuffers: any[];
  byteLength: number;

  constructor(gltf?: {json: GLTF; buffers?: any[]}) {
    // @ts-ignore
    this.gltf = gltf || {
      json: {...DEFAULT_GLTF_JSON},
      buffers: []
    };
    this.sourceBuffers = [];
    this.byteLength = 0;

    // Initialize buffers
    if (this.gltf.buffers && this.gltf.buffers[0]) {
      this.byteLength = this.gltf.buffers[0].byteLength;
      this.sourceBuffers = [this.gltf.buffers[0]];
    }
  }

  // Accessors

  get json(): GLTF {
    return this.gltf.json;
  }

  getApplicationData(key: string): {[key: string]: any} {
    // TODO - Data is already unpacked by GLBParser
    const data = this.json[key];
    return data;
  }

  getExtraData(key: string): {[key: string]: any} {
    // TODO - Data is already unpacked by GLBParser
    const extras = this.json.extras || {};
    return extras[key];
  }

  getExtension(extensionName: string): {[key: string]: any} | null {
    const isExtension = this.getUsedExtensions().find((name) => name === extensionName);
    const extensions = this.json.extensions || {};
    return isExtension ? extensions[extensionName] || true : null;
  }

  getRequiredExtension(extensionName: string): {[key: string]: any} | null {
    const isRequired = this.getRequiredExtensions().find((name) => name === extensionName);
    return isRequired ? this.getExtension(extensionName) : null;
  }

  getRequiredExtensions(): string[] {
    return this.json.extensionsRequired || [];
  }

  getUsedExtensions(): string[] {
    return this.json.extensionsUsed || [];
  }

  getObjectExtension(
    object: {[key: string]: any},
    extensionName: string
  ): {[key: string]: any} | null {
    const extensions = object.extensions || {};
    return extensions[extensionName];
  }

  getScene(index: number): GLTFScene {
    return this.getObject('scenes', index) as GLTFScene;
  }

  getNode(index: number): GLTFNode {
    return this.getObject('nodes', index) as GLTFNode;
  }

  getSkin(index: number): GLTFSkin {
    return this.getObject('skins', index) as GLTFSkin;
  }

  getMesh(index: number): GLTFMesh {
    return this.getObject('meshes', index) as GLTFMesh;
  }

  getMaterial(index: number): GLTFMaterial {
    return this.getObject('materials', index) as GLTFMaterial;
  }

  getAccessor(index: number): GLTFAccessor {
    return this.getObject('accessors', index) as GLTFAccessor;
  }

  // getCamera(index: number): object | null {
  //   return null; // TODO: fix thi: object  as null;
  // }

  getTexture(index: number): GLTFTexture {
    return this.getObject('textures', index) as GLTFTexture;
  }

  getSampler(index: number): GLTFSampler {
    return this.getObject('samplers', index) as GLTFSampler;
  }

  getImage(index: number): GLTFImage {
    return this.getObject('images', index) as GLTFImage;
  }

  getBufferView(index: number | object): GLTFBufferView {
    return this.getObject('bufferViews', index) as GLTFBufferView;
  }

  getBuffer(index: number): GLTFBuffer {
    return this.getObject('buffers', index) as GLTFBuffer;
  }

  getObject(array: string, index: number | object): object {
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

  /**
   * Accepts buffer view index or buffer view object
   * @returns a `Uint8Array`
   */
  getTypedArrayForBufferView(bufferView: number | object): Uint8Array {
    bufferView = this.getBufferView(bufferView);
    // @ts-ignore
    const bufferIndex = bufferView.buffer;

    // Get hold of the arrayBuffer
    // const buffer = this.getBuffer(bufferIndex);
    const binChunk = this.gltf.buffers[bufferIndex];
    assert(binChunk);

    // @ts-ignore
    const byteOffset = (bufferView.byteOffset || 0) + binChunk.byteOffset;
    // @ts-ignore
    return new Uint8Array(binChunk.arrayBuffer, byteOffset, bufferView.byteLength);
  }

  /** Accepts accessor index or accessor object
   * @returns a typed array with type that matches the types
   */
  getTypedArrayForAccessor(accessor: number | object): any {
    // @ts-ignore
    accessor = this.getAccessor(accessor);
    // @ts-ignore
    const bufferView = this.getBufferView(accessor.bufferView);
    const buffer = this.getBuffer(bufferView.buffer);
    // @ts-ignore
    const arrayBuffer = buffer.data;

    // Create a new typed array as a view into the combined buffer
    const {ArrayType, length} = getAccessorArrayTypeAndLength(accessor, bufferView);
    // @ts-ignore
    const byteOffset = bufferView.byteOffset + accessor.byteOffset;
    return new ArrayType(arrayBuffer, byteOffset, length);
  }

  /** accepts accessor index or accessor object
   * returns a `Uint8Array`
   */
  getTypedArrayForImageData(image: number | object): Uint8Array {
    // @ts-ignore
    image = this.getAccessor(image);
    // @ts-ignore
    const bufferView = this.getBufferView(image.bufferView);
    const buffer = this.getBuffer(bufferView.buffer);
    // @ts-ignore
    const arrayBuffer = buffer.data;

    const byteOffset = bufferView.byteOffset || 0;
    return new Uint8Array(arrayBuffer, byteOffset, bufferView.byteLength);
  }

  // MODIFERS

  /**
   * Add an extra application-defined key to the top-level data structure
   */
  addApplicationData(key: string, data: object): GLTFScenegraph {
    this.json[key] = data;
    return this;
  }

  /**
   * `extras` - Standard GLTF field for storing application specific data
   */
  addExtraData(key: string, data: object): GLTFScenegraph {
    this.json.extras = this.json.extras || {};
    this.json.extras[key] = data;
    return this;
  }

  addObjectExtension(object: object, extensionName: string, data: object): GLTFScenegraph {
    // @ts-ignore
    object.extensions = object.extensions || {};
    // TODO - clobber or merge?
    // @ts-ignore
    object.extensions[extensionName] = data;
    this.registerUsedExtension(extensionName);
    return this;
  }

  setObjectExtension(object: object, extensionName: string, data: object): void {
    // @ts-ignore
    const extensions = object.extensions || {};
    extensions[extensionName] = data;
    // TODO - add to usedExtensions...
  }

  removeObjectExtension(object: object, extensionName: string): object {
    // @ts-ignore
    const extensions = object.extensions || {};
    const extension = extensions[extensionName];
    delete extensions[extensionName];
    return extension;
  }

  /**
   * Add to standard GLTF top level extension object, mark as used
   */
  addExtension(extensionName: string, extensionData: object = {}): object {
    assert(extensionData);
    this.json.extensions = this.json.extensions || {};
    this.json.extensions[extensionName] = extensionData;
    this.registerUsedExtension(extensionName);
    return extensionData;
  }

  /**
   * Standard GLTF top level extension object, mark as used and required
   */
  addRequiredExtension(extensionName, extensionData: object = {}): object {
    assert(extensionData);
    this.addExtension(extensionName, extensionData);
    this.registerRequiredExtension(extensionName);
    return extensionData;
  }

  /**
   * Add extensionName to list of used extensions
   */
  registerUsedExtension(extensionName: string): void {
    this.json.extensionsUsed = this.json.extensionsUsed || [];
    if (!this.json.extensionsUsed.find((ext) => ext === extensionName)) {
      this.json.extensionsUsed.push(extensionName);
    }
  }

  /**
   * Add extensionName to list of required extensions
   */
  registerRequiredExtension(extensionName: string): void {
    this.registerUsedExtension(extensionName);
    this.json.extensionsRequired = this.json.extensionsRequired || [];
    if (!this.json.extensionsRequired.find((ext) => ext === extensionName)) {
      this.json.extensionsRequired.push(extensionName);
    }
  }

  /**
   * Removes an extension from the top-level list
   */
  removeExtension(extensionName: string): void {
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

  /**
   *  Set default scene which is to be displayed at load time
   */
  setDefaultScene(sceneIndex: number): void {
    this.json.scene = sceneIndex;
  }

  /**
   * @todo: add more properties for scene initialization:
   *   name`, `extensions`, `extras`
   *   https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#reference-scene
   */
  addScene(scene: {nodeIndices: number[]}): number {
    const {nodeIndices} = scene;
    this.json.scenes = this.json.scenes || [];
    this.json.scenes.push({nodes: nodeIndices});
    return this.json.scenes.length - 1;
  }

  /**
   * @todo: add more properties for node initialization:
   *   `name`, `extensions`, `extras`, `camera`, `children`, `skin`, `rotation`, `scale`, `translation`, `weights`
   *   https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#node
   */
  addNode(node: {meshIndex: number; matrix: number[]}): number {
    const {meshIndex, matrix} = node;
    this.json.nodes = this.json.nodes || [];
    const nodeData = {mesh: meshIndex};
    if (matrix) {
      // @ts-ignore
      nodeData.matrix = matrix;
    }
    this.json.nodes.push(nodeData);
    return this.json.nodes.length - 1;
  }

  /** Adds a mesh to the json part */
  addMesh(mesh: {attributes: object; indices: object; material: number; mode: number}): number {
    const {attributes, indices, material, mode = 4} = mesh;
    const accessors = this._addAttributes(attributes);

    const glTFMesh = {
      primitives: [
        {
          attributes: accessors,
          mode
        }
      ]
    };

    if (indices) {
      const indicesAccessor = this._addIndices(indices);
      // @ts-ignore
      glTFMesh.primitives[0].indices = indicesAccessor;
    }

    if (Number.isFinite(material)) {
      // @ts-ignore
      glTFMesh.primitives[0].material = material;
    }

    this.json.meshes = this.json.meshes || [];
    this.json.meshes.push(glTFMesh);
    return this.json.meshes.length - 1;
  }

  addPointCloud(attributes: object): number {
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

  /**
   * Adds a binary image. Builds glTF "JSON metadata" and saves buffer reference
   * Buffer will be copied into BIN chunk during "pack"
   * Currently encodes as glTF image
   * @param imageData
   * @param mimeType
   */
  addImage(imageData: any, mimeTypeOpt?: string): number {
    // If image is referencing a bufferView instead of URI, mimeType must be defined:
    //   https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#images
    //   "a reference to a bufferView; in that case mimeType must be defined."
    const metadata = getBinaryImageMetadata(imageData);
    const mimeType = mimeTypeOpt || metadata?.mimeType;

    const bufferViewIndex = this.addBufferView(imageData);

    const glTFImage = {
      bufferView: bufferViewIndex,
      mimeType
    };

    this.json.images = this.json.images || [];
    this.json.images.push(glTFImage);
    return this.json.images.length - 1;
  }

  /**
   * Add one untyped source buffer, create a matching glTF `bufferView`, and return its index
   * @param buffer
   */
  addBufferView(buffer: any): number {
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
    this.byteLength += padToNBytes(byteLength, 4);

    // Add a bufferView indicating start and length of this binary sub-chunk
    this.json.bufferViews = this.json.bufferViews || [];
    this.json.bufferViews.push(glTFBufferView);
    return this.json.bufferViews.length - 1;
  }

  /**
   * Adds an accessor to a bufferView
   * @param bufferViewIndex
   * @param accessor
   */
  addAccessor(bufferViewIndex: number, accessor: object): number {
    const glTFAccessor = {
      bufferView: bufferViewIndex,
      // @ts-ignore
      type: getAccessorTypeFromSize(accessor.size),
      // @ts-ignore
      componentType: accessor.componentType,
      // @ts-ignore
      count: accessor.count,
      // @ts-ignore
      max: accessor.max,
      // @ts-ignore
      min: accessor.min
    };

    this.json.accessors = this.json.accessors || [];
    this.json.accessors.push(glTFAccessor);
    return this.json.accessors.length - 1;
  }

  /**
   * Add a binary buffer. Builds glTF "JSON metadata" and saves buffer reference
   * Buffer will be copied into BIN chunk during "pack"
   * Currently encodes buffers as glTF accessors, but this could be optimized
   * @param sourceBuffer
   * @param accessor
   */
  addBinaryBuffer(sourceBuffer: any, accessor: object = {size: 3}): number {
    const bufferViewIndex = this.addBufferView(sourceBuffer);
    // @ts-ignore
    let minMax = {min: accessor.min, max: accessor.max};
    if (!minMax.min || !minMax.max) {
      // @ts-ignore
      minMax = this._getAccessorMinMax(sourceBuffer, accessor.size);
    }

    const accessorDefaults = {
      // @ts-ignore
      size: accessor.size,
      componentType: getComponentTypeFromArray(sourceBuffer),
      // @ts-ignore
      count: Math.round(sourceBuffer.length / accessor.size),
      min: minMax.min,
      max: minMax.max
    };

    return this.addAccessor(bufferViewIndex, Object.assign(accessorDefaults, accessor));
  }

  /**
   * Adds a texture to the json part
   * @todo: add more properties for texture initialization
   * `sampler`, `name`, `extensions`, `extras`
   * https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#texture
   */
  addTexture(texture: {imageIndex: number}): number {
    const {imageIndex} = texture;
    const glTFTexture = {
      source: imageIndex
    };

    this.json.textures = this.json.textures || [];
    this.json.textures.push(glTFTexture);
    return this.json.textures.length - 1;
  }

  /** Adds a material to the json part */
  addMaterial(pbrMaterialInfo: Object): number {
    this.json.materials = this.json.materials || [];
    this.json.materials.push(pbrMaterialInfo);
    return this.json.materials.length - 1;
  }

  /** Pack the binary chunk */
  createBinaryChunk(): void {
    // Encoder expects this array undefined or empty
    this.gltf.buffers = [];

    // Allocate total array
    const totalByteLength = this.byteLength;
    const arrayBuffer = new ArrayBuffer(totalByteLength);
    const targetArray = new Uint8Array(arrayBuffer);

    // Copy each array into
    let dstByteOffset = 0;
    for (const sourceBuffer of this.sourceBuffers || []) {
      dstByteOffset = copyToArray(sourceBuffer, targetArray, dstByteOffset);
    }

    // Update the glTF BIN CHUNK byte length
    this.json.buffers = this.json.buffers || [];
    this.json.buffers[0] = this.json.buffers[0] || {};
    this.json.buffers[0].byteLength = totalByteLength;

    // Save generated arrayBuffer
    this.gltf.binary = arrayBuffer;

    // Put arrayBuffer to sourceBuffers for possible additional writing data in the chunk
    this.sourceBuffers = [arrayBuffer];
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

  /**
   * Add attributes to buffers and create `attributes` object which is part of `mesh`
   */
  _addAttributes(attributes = {}) {
    const result = {};
    for (const attributeKey in attributes) {
      const attributeData = attributes[attributeKey];
      const attrName = this._getGltfAttributeName(attributeKey);
      const accessor = this.addBinaryBuffer(attributeData.value, attributeData);
      result[attrName] = accessor;
    }
    return result;
  }

  /**
   * Add indices to buffers
   */
  _addIndices(indices) {
    return this.addBinaryBuffer(indices, {size: 1});
  }

  /**
   * Deduce gltf specific attribue name from input attribute name
   */
  _getGltfAttributeName(attributeName) {
    switch (attributeName.toLowerCase()) {
      case 'position':
      case 'positions':
      case 'vertices':
        return 'POSITION';
      case 'normal':
      case 'normals':
        return 'NORMAL';
      case 'color':
      case 'colors':
        return 'COLOR_0';
      case 'texcoord':
      case 'texcoords':
        return 'TEXCOORD_0';
      default:
        return attributeName;
    }
  }

  /**
   * Calculate `min` and `max` arrays of accessor according to spec:
   * https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#reference-accessor
   */
  _getAccessorMinMax(buffer, size) {
    const result = {min: null, max: null};
    if (buffer.length < size) {
      return result;
    }
    // @ts-ignore
    result.min = [];
    // @ts-ignore
    result.max = [];
    const initValues = buffer.subarray(0, size);
    for (const value of initValues) {
      // @ts-ignore
      result.min.push(value);
      // @ts-ignore
      result.max.push(value);
    }

    for (let index = size; index < buffer.length; index += size) {
      for (let componentIndex = 0; componentIndex < size; componentIndex++) {
        // @ts-ignore
        result.min[0 + componentIndex] = Math.min(
          // @ts-ignore
          result.min[0 + componentIndex],
          buffer[index + componentIndex]
        );
        // @ts-ignore
        result.max[0 + componentIndex] = Math.max(
          // @ts-ignore
          result.max[0 + componentIndex],
          buffer[index + componentIndex]
        );
      }
    }
    return result;
  }
}
