// This code is a fork of example code from the DRACO repository
// Copyright 2017 The Draco Authors.
// Licensed under the Apache License, Version 2.0 (the 'License');
import {getMeshBoundingBox} from '@loaders.gl/loader-utils';

const GEOMETRY_TYPE = {
  TRIANGULAR_MESH: 0,
  POINT_CLOUD: 1
};

// Native Draco attribute names to GLTF attribute names.
const DRACO_TO_GLTF_ATTRIBUTE_NAME_MAP = {
  POSITION: 'POSITION',
  NORMAL: 'NORMAL',
  COLOR: 'COLOR_0',
  TEX_COORD: 'TEXCOORD_0'
};

const DRACO_DATA_TYPE_TO_TYPED_ARRAY_MAP = {
  1: Int8Array,
  2: Uint8Array,
  3: Int16Array,
  4: Uint16Array,
  5: Int32Array,
  6: Uint32Array,
  9: Float32Array
};

export default class DracoParser {
  // draco - the draco decoder, either import `draco3d` or load dynamically
  constructor(draco) {
    this.draco = draco;
    this.drawMode = 'TRIANGLE';
  }

  destroy() {}

  destroyGeometry(dracoGeometry) {
    if (dracoGeometry) {
      this.draco.destroy(dracoGeometry.dracoGeometry);
    }
  }

  // NOTE: caller must call `destroyGeometry` on the return value after using it
  parseSync(arrayBuffer, options) {
    const buffer = new this.draco.DecoderBuffer();
    buffer.Init(new Int8Array(arrayBuffer), arrayBuffer.byteLength);

    const decoder = new this.draco.Decoder();

    const data = {};
    let dracoStatus;
    let dracoGeometry;
    let header;

    try {
      const geometryType = decoder.GetEncodedGeometryType(buffer);
      switch (geometryType) {
        case this.draco.TRIANGULAR_MESH:
          dracoGeometry = new this.draco.Mesh();
          dracoStatus = decoder.DecodeBufferToMesh(buffer, dracoGeometry);
          header = {
            type: GEOMETRY_TYPE.TRIANGULAR_MESH,
            faceCount: dracoGeometry.num_faces(),
            attributeCount: dracoGeometry.num_attributes(),
            vertexCount: dracoGeometry.num_points()
          };
          break;

        case this.draco.POINT_CLOUD:
          dracoGeometry = new this.draco.PointCloud();
          dracoStatus = decoder.DecodeBufferToPointCloud(buffer, dracoGeometry);
          header = {
            type: GEOMETRY_TYPE.POINT_CLOUD,
            attributeCount: dracoGeometry.num_attributes(),
            vertexCount: dracoGeometry.num_points()
          };
          break;

        default:
          throw new Error('Unknown DRACO geometry type.');
      }

      if (!dracoStatus.ok() || !dracoGeometry.ptr) {
        const message = `DRACO decompression failed: ${dracoStatus.error_msg()}`;
        // console.error(message);
        if (dracoGeometry) {
          this.draco.destroy(dracoGeometry);
        }
        throw new Error(message);
      }

      data.loaderData = {header};

      this.extractDRACOGeometry(decoder, dracoGeometry, geometryType, data, options);

      data.header = {
        vertexCount: header.vertexCount,
        boundingBox: getMeshBoundingBox(data.attributes)
      };
    } finally {
      this.draco.destroy(decoder);
      this.draco.destroy(buffer);
    }

    return data;
  }

  extractDRACOGeometry(decoder, dracoGeometry, geometryType, geometry, options) {
    // const numPoints = dracoGeometry.num_points();
    // const numAttributes = dracoGeometry.num_attributes();

    // Structure for converting to WebGL framework specific attributes later
    const attributes = this.getAttributes(decoder, dracoGeometry, options);

    const positionAttribute = attributes.POSITION;
    if (!positionAttribute) {
      throw new Error('DRACO decompressor: No position attribute found.');
    }

    this.getPositionAttributeMetadata(positionAttribute);

    // For meshes, we need indices to define the faces.
    if (geometryType === this.draco.TRIANGULAR_MESH) {
      attributes.indices =
        this.drawMode === 'TRIANGLE_STRIP'
          ? this.getMeshStripIndices(decoder, dracoGeometry)
          : this.getMeshFaceIndices(decoder, dracoGeometry);
      geometry.mode =
        this.drawMode === 'TRIANGLE_STRIP'
          ? 5 // GL.TRIANGLE_STRIP
          : 4; // GL.TRIANGLES
    } else {
      geometry.mode = 0; // GL.POINTS
    }

    if (attributes.indices) {
      geometry.indices = {value: attributes.indices, size: 1};
      delete attributes.indices;
    }
    geometry.attributes = attributes;

    return geometry;
  }

  getPositionAttributeMetadata(positionAttribute) {
    this.metadata = this.metadata || {};
    this.metadata.attributes = this.metadata.attributes || {};

    const posTransform = new this.draco.AttributeQuantizationTransform();
    if (posTransform.InitFromAttribute(positionAttribute)) {
      // Quantized attribute. Store the quantization parameters into the attribute
      this.metadata.attributes.position.isQuantized = true;
      this.metadata.attributes.position.maxRange = posTransform.range();
      this.metadata.attributes.position.numQuantizationBits = posTransform.quantization_bits();
      this.metadata.attributes.position.minValues = new Float32Array(3);
      for (let i = 0; i < 3; ++i) {
        this.metadata.attributes.position.minValues[i] = posTransform.min_value(i);
      }
    }
    this.draco.destroy(posTransform);
  }

  getAttributes(decoder, dracoGeometry, options) {
    const attributes = {};
    const numPoints = dracoGeometry.num_points();
    // const attributeUniqueIdMap = {};

    for (const attributeName in DRACO_TO_GLTF_ATTRIBUTE_NAME_MAP) {
      // The native attribute type is only used when no unique Id is provided.
      // For example, loading .drc files.
      // if (attributeUniqueIdMap[attributeName] === undefined) {
      const attributeType = this.draco[attributeName];
      const attributeId = decoder.GetAttributeId(dracoGeometry, attributeType);

      if (attributeId !== -1) {
        const dracoAttribute = decoder.GetAttribute(dracoGeometry, attributeId);
        const {typedArray} = this.getAttributeTypedArray(
          decoder,
          dracoGeometry,
          dracoAttribute,
          attributeName
        );
        attributes[DRACO_TO_GLTF_ATTRIBUTE_NAME_MAP[attributeName]] = {
          value: typedArray,
          size: typedArray.length / numPoints
        };
      } // }
    }
    if (options.extraAttributes) {
      for (const [attributeName, attributeUniqueId] of Object.entries(options.extraAttributes)) {
        const dracoAttribute = decoder.GetAttributeByUniqueId(dracoGeometry, attributeUniqueId);

        const {typedArray} = this.getAttributeTypedArray(
          decoder,
          dracoGeometry,
          dracoAttribute,
          attributeName
        );
        attributes[attributeName] = {
          value: typedArray,
          size: typedArray.length / numPoints
        };
      }
    }
    // // Add attributes of user specified unique id. E.g. GLTF models.
    // for (const attributeName in attributeUniqueIdMap) {
    //   const attributeType = attributeTypeMap[attributeName] || Float32Array;
    //   const attributeId = attributeUniqueIdMap[attributeName];
    //   const attribute = decoder.GetAttributeByUniqueId(dracoGeometry, attributeId);
    //   this.getAttributeTypedArray(decoder, dracoGeometry, attribute,attributeName,attributeType);
    // }

    return attributes;
  }

  // For meshes, we need indices to define the faces.
  getMeshFaceIndices(decoder, dracoGeometry) {
    // Example on how to retrieve mesh and attributes.
    const numFaces = dracoGeometry.num_faces();

    const numIndices = numFaces * 3;
    const indices = new Uint32Array(numIndices);
    const dracoArray = new this.draco.DracoInt32Array();
    for (let i = 0; i < numFaces; ++i) {
      decoder.GetFaceFromMesh(dracoGeometry, i, dracoArray);
      const index = i * 3;
      indices[index] = dracoArray.GetValue(0);
      indices[index + 1] = dracoArray.GetValue(1);
      indices[index + 2] = dracoArray.GetValue(2);
    }

    this.draco.destroy(dracoArray);
    return indices;
  }

  // For meshes, we need indices to define the faces.
  getMeshStripIndices(decoder, dracoGeometry) {
    const dracoArray = new this.draco.DracoInt32Array();
    /* const numStrips = */ decoder.GetTriangleStripsFromMesh(dracoGeometry, dracoArray);
    const indices = new Uint32Array(dracoArray.size());
    for (let i = 0; i < dracoArray.size(); ++i) {
      indices[i] = dracoArray.GetValue(i);
    }
    this.draco.destroy(dracoArray);
    return indices;
  }

  getAttributeTypedArray(decoder, dracoGeometry, dracoAttribute, attributeName) {
    if (dracoAttribute.ptr === 0) {
      const message = `DRACO decode bad attribute ${attributeName}`;
      // console.error(message);
      throw new Error(message);
    }

    const attributeType = DRACO_DATA_TYPE_TO_TYPED_ARRAY_MAP[dracoAttribute.data_type()];
    const numComponents = dracoAttribute.num_components();
    const numPoints = dracoGeometry.num_points();
    const numValues = numPoints * numComponents;

    let dracoArray;
    let typedArray;

    switch (attributeType) {
      case Float32Array:
        dracoArray = new this.draco.DracoFloat32Array();
        decoder.GetAttributeFloatForAllPoints(dracoGeometry, dracoAttribute, dracoArray);
        typedArray = new Float32Array(numValues);
        break;

      case Int8Array:
        dracoArray = new this.draco.DracoInt8Array();
        decoder.GetAttributeInt8ForAllPoints(dracoGeometry, dracoAttribute, dracoArray);
        typedArray = new Int8Array(numValues);
        break;

      case Int16Array:
        dracoArray = new this.draco.DracoInt16Array();
        decoder.GetAttributeInt16ForAllPoints(dracoGeometry, dracoAttribute, dracoArray);
        typedArray = new Int16Array(numValues);
        break;

      case Int32Array:
        dracoArray = new this.draco.DracoInt32Array();
        decoder.GetAttributeInt32ForAllPoints(dracoGeometry, dracoAttribute, dracoArray);
        typedArray = new Int32Array(numValues);
        break;

      case Uint8Array:
        dracoArray = new this.draco.DracoUInt8Array();
        decoder.GetAttributeUInt8ForAllPoints(dracoGeometry, dracoAttribute, dracoArray);
        typedArray = new Uint8Array(numValues);
        break;

      case Uint16Array:
        dracoArray = new this.draco.DracoUInt16Array();
        decoder.GetAttributeUInt16ForAllPoints(dracoGeometry, dracoAttribute, dracoArray);
        typedArray = new Uint16Array(numValues);
        break;

      case Uint32Array:
        dracoArray = new this.draco.DracoUInt32Array();
        decoder.GetAttributeUInt32ForAllPoints(dracoGeometry, dracoAttribute, dracoArray);
        typedArray = new Uint32Array(numValues);
        break;

      default:
        const errorMsg = 'DRACO decoder: unexpected attribute type.';
        // console.error(errorMsg);
        throw new Error(errorMsg);
    }

    // Copy data from decoder.
    for (let i = 0; i < numValues; i++) {
      typedArray[i] = dracoArray.GetValue(i);
    }

    this.draco.destroy(dracoArray);

    return {typedArray, components: numComponents};
  }

  // DEPRECATED

  decode(arrayBuffer, options) {
    return this.parseSync(arrayBuffer, options);
  }
}
