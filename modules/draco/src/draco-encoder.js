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

/* global console */
/* eslint-disable no-console */
const draco3d = require('draco3d');

const DEFAULT_ENCODING_OPTIONS = {
  method: 'MESH_EDGEBREAKER_ENCODING',
  speed: [5, 5],
  quantization: {
    POSITION: 10
  }
};

/* Encoder API:
https://github.com/google/draco/blob/master/src/draco/javascript/emscripten/draco_web_encoder.idl
   Example:
https://github.com/google/draco/blob/master/javascript/npm/draco3d/draco_nodejs_example.js
 */
export default class DRACOEncoder {
  constructor() {
    this.dracoEncoderModule = draco3d.createEncoderModule({});
    this.dracoEncoder = new this.dracoEncoderModule.Encoder();
    this.dracoMeshBuilder = new this.dracoEncoderModule.MeshBuilder();
    this.setOptions(DEFAULT_ENCODING_OPTIONS);
  }

  destroy() {
    this.dracoEncoderModule.destroy(this.dracoMeshBuilder);
    this.dracoEncoderModule.destroy(this.dracoEncoder);
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
      const encodedLen =
        this.dracoEncoder.EncodePointCloudToDracoBuffer(dracoPointCloud, false, dracoData);

      if (!(encodedLen > 0)) {
        throw new Error('Draco encoding failed.');
      }
      console.log(`DRACO encoded ${dracoPointCloud.num_points()} points
        with ${dracoPointCloud.num_attributes()} attributes into ${encodedLen} bytes`);

      // Copy encoded data to buffer.
      const outputBuffer = new ArrayBuffer(encodedLen);
      const outputData = new Int8Array(outputBuffer);
      for (let i = 0; i < encodedLen; ++i) {
        outputData[i] = dracoData.GetValue(i);
      }

      return outputBuffer;

    } finally {
      this.dracoEncoderModule.destroy(dracoData);
      this.dracoEncoderModule.destroy(dracoPointCloud);
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
      console.log(`DRACO encoded ${dracoMesh.num_points()} points
        with ${dracoMesh.num_attributes()} attributes into ${encodedLen} bytes`);

      // Copy encoded data to buffer.
      const outputBuffer = new ArrayBuffer(encodedLen);
      const outputData = new Int8Array(outputBuffer);
      for (let i = 0; i < encodedLen; ++i) {
        outputData[i] = dracoData.GetValue(i);
      }

      return outputBuffer;

    } finally {
      this.dracoEncoderModule.destroy(dracoData);
      this.dracoEncoderModule.destroy(dracoMesh);
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

      for (const attributeName in attributes) {
        const attribute = attributes[attributeName];
        this._addAttributeToMesh(dracoMesh, attributeName, attribute, vertexCount);
      }

    } catch (error) {
      this.dracoEncoderModule.destroy(dracoMesh);
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

      for (const attributeName in attributes) {
        const attribute = attributes[attributeName];
        this._addAttributeToMesh(dracoPointCloud, attributeName, attribute, vertexCount);
      }

    } catch (error) {
      this.dracoEncoderModule.destroy(dracoPointCloud);
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

    switch (dracoAttributeType) {
    case 'indices':
      const numFaces = attribute.length / 3;
      this.dracoMeshBuilder.AddFacesToMesh(dracoMesh, numFaces, attribute);
      break;

    // TODO - handle different attribute types
    default:
      const dataType = this._getDataType(attribute);
      console.log(`DRACO adding ${dataType} attribute ${attributeName}`,
        dracoAttributeType, vertexCount, size); // , attribute);

      this.dracoMeshBuilder[`Add${dataType}Attribute`](
        dracoMesh, dracoAttributeType, vertexCount, size, attribute
      );
    }
  }

  _getDataType(attribute) {
    switch (attribute.constructor.name) {
    case 'Int8Array':
      return 'Int8';

    case 'Int16Array':
      return 'Int16';

    case 'Int32Array':
      return 'Int32';

    case 'Uint8Array':
    case 'Uint8ClampedArray':
      return 'UInt8';

    case 'Uint16Array':
      return 'UInt16';

    case 'Uint32Array':
      return 'UInt32';

    case 'Float32Array':
    default:
      return 'Float';
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
