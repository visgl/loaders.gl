// This code is inspired by example code from the DRACO repository
// Encoder API: https://github.com/google/draco/blob/master/src/draco/javascript/emscripten/draco_web_encoder.idl
// Example: https://github.com/google/draco/blob/master/javascript/npm/draco3d/draco_nodejs_example.js

/** @typedef {import('../types/draco-types')} Draco3D */
/** @typedef {import('../types/draco-types').Encoder} Encoder */
/** @typedef {import('../types/draco-types').Mesh} Mesh */
/** @typedef {import('../types/draco-types').PointCloud} PointCloud */
/** @typedef {import('../types/draco-types').TypedArray} TypedArray */

// Native Draco attribute names to GLTF attribute names.
const GLTF_TO_DRACO_ATTRIBUTE_NAME_MAP = {
  POSITION: 'POSITION',
  NORMAL: 'NORMAL',
  COLOR_0: 'COLOR',
  TEXCOORD_0: 'TEX_COORD'
};

function noop() {}

export default class DracoBuilder {
  // draco - the draco decoder, either import `draco3d` or load dynamically
  constructor(draco, options = {}) {
    /** @type {Draco3D} */
    this.draco = draco;
    this.dracoEncoder = new this.draco.Encoder();
    this.dracoMeshBuilder = new this.draco.MeshBuilder();
    this.log = options.log || noop;
  }

  destroy() {
    this.destroyEncodedObject(this.dracoMeshBuilder);
    this.destroyEncodedObject(this.dracoEncoder);
    // @ts-ignore
    this.dracoMeshBuilder = null;
    // @ts-ignore
    this.dracoEncoder = null;
    // @ts-ignore
    this.draco = null;
  }

  // TBD - when does this need to be called?
  destroyEncodedObject(object) {
    if (object) {
      this.draco.destroy(object);
    }
  }

  // Encode mesh=({})
  encodeSync(mesh, options = {}) {
    this._setOptions(options);

    return options.pointcloud
      ? this._encodePointCloud(mesh, options)
      : this._encodeMesh(mesh, options);
  }

  // PRIVATE

  _getAttributesFromMesh(mesh) {
    // TODO - Change the encodePointCloud interface instead?
    const attributes = {...mesh, ...mesh.attributes};
    // Fold indices into the attributes
    if (mesh.indices) {
      attributes.indices = mesh.indices;
    }
    return attributes;
  }

  _encodePointCloud(pointcloud, options) {
    const attributes = this._getAttributesFromMesh(pointcloud);

    // Build a `DracoPointCloud` from the input data
    const dracoPointCloud = this._createDracoPointCloud(attributes, options);

    const dracoData = new this.draco.DracoInt8Array();

    try {
      const encodedLen = this.dracoEncoder.EncodePointCloudToDracoBuffer(
        dracoPointCloud,
        false,
        dracoData
      );

      if (!(encodedLen > 0)) {
        throw new Error('Draco encoding failed.');
      }

      this.log(`DRACO encoded ${dracoPointCloud.num_points()} points
        with ${dracoPointCloud.num_attributes()} attributes into ${encodedLen} bytes`);

      return dracoInt8ArrayToArrayBuffer(dracoData);
    } finally {
      this.destroyEncodedObject(dracoData);
      this.destroyEncodedObject(dracoPointCloud);
    }
  }

  _encodeMesh(mesh, options) {
    const attributes = this._getAttributesFromMesh(mesh);

    // Build a `DracoMesh` from the input data
    const dracoMesh = this._createDracoMesh(attributes, options);

    const dracoData = new this.draco.DracoInt8Array();

    try {
      const encodedLen = this.dracoEncoder.EncodeMeshToDracoBuffer(dracoMesh, dracoData);
      if (encodedLen <= 0) {
        throw new Error('Draco encoding failed.');
      }

      this.log(`DRACO encoded ${dracoMesh.num_points()} points
        with ${dracoMesh.num_attributes()} attributes into ${encodedLen} bytes`);

      return dracoInt8ArrayToArrayBuffer(dracoData);
    } finally {
      this.destroyEncodedObject(dracoData);
      this.destroyEncodedObject(dracoMesh);
    }
  }

  /**
   * Set encoding options.
   * @param {{speed?: any; method?: any; quantization?: any;}} options
   */
  _setOptions(options) {
    if ('speed' in options) {
      // @ts-ignore
      this.dracoEncoder.SetSpeedOptions(...options.speed);
    }
    if ('method' in options) {
      const dracoMethod = this.draco[options.method];
      // assert(dracoMethod)
      this.dracoEncoder.SetEncodingMethod(dracoMethod);
    }
    if ('quantization' in options) {
      for (const attribute in options.quantization) {
        const bits = options.quantization[attribute];
        const dracoPosition = this.draco[attribute];
        this.dracoEncoder.SetAttributeQuantization(dracoPosition, bits);
      }
    }
  }

  /**
   * @param {object} attributes
   * @returns {Mesh}
   */
  _createDracoMesh(attributes, options) {
    const dracoMesh = new this.draco.Mesh();

    try {
      const positions = this._getPositionAttribute(attributes);
      if (!positions) {
        throw new Error('positions');
      }
      const vertexCount = positions.length / 3;

      for (let attributeName in attributes) {
        const attribute = attributes[attributeName];
        attributeName = GLTF_TO_DRACO_ATTRIBUTE_NAME_MAP[attributeName] || attributeName;
        this._addAttributeToMesh(dracoMesh, attributeName, attribute, vertexCount);
      }
    } catch (error) {
      this.destroyEncodedObject(dracoMesh);
      throw error;
    }

    return dracoMesh;
  }

  /**
   * @param {object} attributes
   * @returns {PointCloud}
   */
  _createDracoPointCloud(attributes, options) {
    const dracoPointCloud = new this.draco.PointCloud();

    try {
      const positions = this._getPositionAttribute(attributes);
      if (!positions) {
        throw new Error('positions');
      }
      const vertexCount = positions.length / 3;

      for (let attributeName in attributes) {
        const attribute = attributes[attributeName];
        attributeName = GLTF_TO_DRACO_ATTRIBUTE_NAME_MAP[attributeName] || attributeName;
        this._addAttributeToMesh(dracoPointCloud, attributeName, attribute, vertexCount);
      }
    } catch (error) {
      this.destroyEncodedObject(dracoPointCloud);
      throw error;
    }

    return dracoPointCloud;
  }

  /**
   * @param {PointCloud} mesh
   * @param {string} attributeName
   * @param {TypedArray} attribute
   * @param {number} vertexCount
   */
  _addAttributeToMesh(mesh, attributeName, attribute, vertexCount) {
    if (!ArrayBuffer.isView(attribute)) {
      return -1;
    }

    const type = this._getDracoAttributeType(attributeName);
    // @ts-ignore TODO/fix types
    const size = attribute.length / vertexCount;

    if (type === 'indices') {
      // @ts-ignore TODO/fix types
      const numFaces = attribute.length / 3;
      this.log(`Adding attribute ${attributeName}, size ${numFaces}`);

      // @ts-ignore assumes mesh is a Mesh, not a point cloud
      this.dracoMeshBuilder.AddFacesToMesh(mesh, numFaces, attribute);
      return -1;
    }

    this.log(`Adding attribute ${attributeName}, size ${size}`);

    const builder = this.dracoMeshBuilder;
    const {buffer} = attribute;

    switch (attribute.constructor) {
      case Int8Array:
        return builder.AddInt8Attribute(mesh, type, vertexCount, size, new Int8Array(buffer));

      case Int16Array:
        return builder.AddInt16Attribute(mesh, type, vertexCount, size, new Int16Array(buffer));

      case Int32Array:
        return builder.AddInt32Attribute(mesh, type, vertexCount, size, new Int32Array(buffer));
      case Uint8Array:
      case Uint8ClampedArray:
        return builder.AddUInt8Attribute(mesh, type, vertexCount, size, new Uint8Array(buffer));

      case Uint16Array:
        return builder.AddUInt16Attribute(mesh, type, vertexCount, size, new Uint16Array(buffer));

      case Uint32Array:
        return builder.AddUInt32Attribute(mesh, type, vertexCount, size, new Uint32Array(buffer));

      case Float32Array:
      default:
        return builder.AddFloatAttribute(mesh, type, vertexCount, size, new Float32Array(buffer));
    }
  }

  /**
   * DRACO can compress attributes of know type better
   * TODO - expose an attribute type map?
   * @param {*} attributeName
   */
  _getDracoAttributeType(attributeName) {
    switch (attributeName.toLowerCase()) {
      case 'indices':
        return 'indices';
      case 'position':
      case 'positions':
      case 'vertices':
        return this.draco.POSITION;
      case 'normal':
      case 'normals':
        return this.draco.NORMAL;
      case 'color':
      case 'colors':
        return this.draco.COLOR;
      case 'texCoord':
      case 'texCoords':
        return this.draco.TEX_COORD;
      default:
        return this.draco.GENERIC;
    }
  }

  _getPositionAttribute(attributes) {
    for (const attributeName in attributes) {
      const attribute = attributes[attributeName];
      const dracoType = this._getDracoAttributeType(attributeName);
      if (dracoType === this.draco.POSITION) {
        return attribute;
      }
    }
    return null;
  }
}

// HELPER FUNCTIONS

/**
 * Copy encoded data to buffer
 * @param {*} dracoData
 */
function dracoInt8ArrayToArrayBuffer(dracoData) {
  const byteLength = dracoData.size();
  const outputBuffer = new ArrayBuffer(byteLength);
  const outputData = new Int8Array(outputBuffer);
  for (let i = 0; i < byteLength; ++i) {
    outputData[i] = dracoData.GetValue(i);
  }
  return outputBuffer;
}
