// This code is a fork of example code from the DRACO repository
// Copyright 2017 The Draco Authors.
// Licensed under the Apache License, Version 2.0 (the 'License');

// TODO - seems to be some valid TS failures in this file
// @ts-nocheck

// const DEFAULT_ENCODING_OPTIONS = {
//   method: 'MESH_EDGEBREAKER_ENCODING',
//   speed: [5, 5],
//   quantization: {
//     POSITION: 10
//   }
// };

// Native Draco attribute names to GLTF attribute names.
const GLTF_TO_DRACO_ATTRIBUTE_NAME_MAP = {
  POSITION: 'POSITION',
  NORMAL: 'NORMAL',
  COLOR_0: 'COLOR',
  TEXCOORD_0: 'TEX_COORD'
};

function noop() {}

// Copy encoded data to buffer
function dracoInt8ArrayToArrayBuffer(dracoData) {
  const byteLength = dracoData.size();
  const outputBuffer = new ArrayBuffer(byteLength);
  const outputData = new Int8Array(outputBuffer);
  for (let i = 0; i < byteLength; ++i) {
    outputData[i] = dracoData.GetValue(i);
  }
  return outputBuffer;
}

/* Encoder API:
https://github.com/google/draco/blob/master/src/draco/javascript/emscripten/draco_web_encoder.idl
   Example:
https://github.com/google/draco/blob/master/javascript/npm/draco3d/draco_nodejs_example.js
 */
export default class DracoBuilder {
  // draco - the draco decoder, either import `draco3d` or load dynamically
  constructor(draco, options = {}) {
    this.draco = draco;
    this.dracoEncoder = new this.draco.Encoder();
    this.dracoMeshBuilder = new this.draco.MeshBuilder();
    this.log = options.log || noop;
  }

  destroy() {
    this.destroyEncodedObject(this.dracoMeshBuilder);
    this.destroyEncodedObject(this.dracoEncoder);
    this.dracoMeshBuilder = null;
    this.dracoEncoder = null;
    this.draco = null;
  }

  // TBD - when does this need to be called?
  destroyEncodedObject(object) {
    if (object) {
      this.draco.destroy(object);
    }
  }

  // Encode mesh=({})
  encodeSync(mesh, options) {
    this._setOptions(options);
    return options.pointcloud ? this._encodePointCloud(mesh) : this._encodeMesh(mesh);
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

  _encodePointCloud(pointcloud) {
    const attributes = this._getAttributesFromMesh(pointcloud);

    // Build a `DracoPointCloud` from the input data
    const dracoPointCloud = this._createDracoPointCloud(attributes);

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

  _encodeMesh(mesh) {
    const attributes = this._getAttributesFromMesh(mesh);
    // Build a `DracoMesh` from the input data
    const dracoMesh = this._createDracoMesh(attributes);

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
      this.dracoEncoder.SetSpeedOptions(...options.speed);
    }
    if ('method' in options) {
      const dracoMethod = this.draco[options.method];
      // if (dracoMethod === undefined) {}
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

  _createDracoMesh(attributes) {
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

  _createDracoPointCloud(attributes) {
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

  _addAttributeToMesh(dracoMesh, attributeName, attribute, vertexCount) {
    if (!ArrayBuffer.isView(attribute)) {
      return;
    }

    const dracoAttributeType = this._getDracoAttributeType(attributeName, attribute);
    const size = attribute.length / vertexCount;

    if (dracoAttributeType === 'indices') {
      const numFaces = attribute.length / 3;
      this.log(`Adding attribute ${attributeName}, size ${numFaces}`);
      this.dracoMeshBuilder.AddFacesToMesh(dracoMesh, numFaces, attribute);
      return;
    }

    this.log(`Adding attribute ${attributeName}, size ${size}`);

    switch (attribute.constructor.name) {
      case 'Int8Array':
        this.dracoMeshBuilder.AddInt8Attribute(
          dracoMesh,
          dracoAttributeType,
          vertexCount,
          size,
          attribute
        );
        break;

      case 'Int16Array':
        this.dracoMeshBuilder.AddInt16Attribute(
          dracoMesh,
          dracoAttributeType,
          vertexCount,
          size,
          attribute
        );
        break;

      case 'Int32Array':
        this.dracoMeshBuilder.AddInt32Attribute(
          dracoMesh,
          dracoAttributeType,
          vertexCount,
          size,
          attribute
        );
        break;

      case 'Uint8Array':
      case 'Uint8ClampedArray':
        this.dracoMeshBuilder.AddUInt8Attribute(
          dracoMesh,
          dracoAttributeType,
          vertexCount,
          size,
          attribute
        );
        break;

      case 'Uint16Array':
        this.dracoMeshBuilder.AddUInt16Attribute(
          dracoMesh,
          dracoAttributeType,
          vertexCount,
          size,
          attribute
        );
        break;

      case 'Uint32Array':
        this.dracoMeshBuilder.AddUInt32Attribute(
          dracoMesh,
          dracoAttributeType,
          vertexCount,
          size,
          attribute
        );
        break;

      case 'Float32Array':
      default:
        this.dracoMeshBuilder.AddFloatAttribute(
          dracoMesh,
          dracoAttributeType,
          vertexCount,
          size,
          attribute
        );
    }
  }

  // DRACO can compress attributes of know type better
  // TODO - expose an attribute type map?
  _getDracoAttributeType(attributeName, attribute) {
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
      const dracoType = this._getDracoAttributeType(attributeName, attribute);
      if (dracoType === this.draco.POSITION) {
        return attribute;
      }
    }
    return null;
  }
}
