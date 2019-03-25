// This code is based on example code from the DRACO repository

// Copyright 2017 The Draco Authors.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

const draco3d = require('draco3d');

const DEFAULT_ENCODING_OPTIONS = {
  method: 'MESH_EDGEBREAKER_ENCODING',
  speed: [5, 5],
  quantization: {
    POSITION: 10
  }
};

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
export default class DRACOEncoder {
  constructor(opts = {}) {
    this.dracoEncoderModule = draco3d.createEncoderModule({});
    this.dracoEncoder = new this.dracoEncoderModule.Encoder();
    this.dracoMeshBuilder = new this.dracoEncoderModule.MeshBuilder();
    this.setOptions(Object.assign({}, DEFAULT_ENCODING_OPTIONS, opts));

    this.log = opts.log || noop;
  }

  destroy() {
    this.destroyEncodedObject(this.dracoMeshBuilder);
    this.destroyEncodedObject(this.dracoEncoder);
    this.dracoMeshBuilder = null;
    this.dracoEncoder = null;
    this.dracoEncoderModule = null;
  }

  destroyEncodedObject(object) {
    if (object) {
      this.dracoEncoderModule.destroy(object);
    }
  }

  // Set encoding options.
  setOptions(opts = {}) {
    if ('speed' in opts) {
      this.dracoEncoder.SetSpeedOptions(...opts.speed);
    }
    if ('method' in opts) {
      const dracoMethod = this.dracoEncoderModule[opts.method];
      // if (dracoMethod === undefined) {}
      this.dracoEncoder.SetEncodingMethod(dracoMethod);
    }
    if ('quantization' in opts) {
      for (const attribute in opts.quantization) {
        const bits = opts.quantization[attribute];
        const dracoPosition = this.dracoEncoderModule[attribute];
        this.dracoEncoder.SetAttributeQuantization(dracoPosition, bits);
      }
    }
  }

  encodePointCloud(attributes) {
    // Build a `DracoPointCloud` from the input data
    const dracoPointCloud = this._createDracoPointCloud(attributes);

    const dracoData = new this.dracoEncoderModule.DracoInt8Array();

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

  encodeMesh(attributes) {
    // Build a `DracoMesh` from the input data
    const dracoMesh = this._createDracoMesh(attributes);

    const dracoData = new this.dracoEncoderModule.DracoInt8Array();

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

  _createDracoMesh(attributes) {
    const dracoMesh = new this.dracoEncoderModule.Mesh();

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
    const dracoPointCloud = new this.dracoEncoderModule.PointCloud();

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
        return this.dracoEncoderModule.POSITION;
      case 'normal':
      case 'normals':
        return this.dracoEncoderModule.NORMAL;
      case 'color':
      case 'colors':
        return this.dracoEncoderModule.COLOR;
      case 'texCoord':
      case 'texCoords':
        return this.dracoEncoderModule.TEX_COORD;
      default:
        return this.dracoEncoderModule.GENERIC;
    }
  }

  _getPositionAttribute(attributes) {
    for (const attributeName in attributes) {
      const attribute = attributes[attributeName];
      const dracoType = this._getDracoAttributeType(attributeName, attribute);
      if (dracoType === this.dracoEncoderModule.POSITION) {
        return attribute;
      }
    }
    return null;
  }
}
