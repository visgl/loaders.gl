// This code is inspired by example code in the DRACO repository
/** @typedef {import('../types/draco-types')} Draco3D */
/** @typedef {import('../types/draco-types').Decoder} Decoder */
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

const INDEX_ITEM_SIZE = 4;

export default class DracoParser {
  // draco - the draco decoder, either import `draco3d` or load dynamically
  constructor(draco) {
    /** @type {Draco3D} */
    this.draco = draco;
    this.drawMode = 'TRIANGLE';
    this.metadataQuerier = {};
  }

  destroy() {}

  parseSync(arrayBuffer, options = {}) {
    this.metadataQuerier = new this.draco.MetadataQuerier();
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

      // @ts-ignore .ptr
      if (!dracoStatus.ok() || !dracoGeometry.ptr) {
        const message = `DRACO decompression failed: ${dracoStatus.error_msg()}`;
        // console.error(message);
        if (dracoGeometry) {
          this.draco.destroy(dracoGeometry);
        }
        throw new Error(message);
      }

      data.loaderData = {header};

      this._extractDRACOGeometry(decoder, dracoGeometry, geometryType, data, options);
      const metadata = this._getGeometryMetadata(decoder, dracoGeometry);

      data.header = {
        vertexCount: header.vertexCount,
        boundingBox: getMeshBoundingBox(data.attributes),
        metadata
      };
    } finally {
      this.draco.destroy(decoder);
      this.draco.destroy(buffer);
      this.draco.destroy(dracoGeometry);
      this.draco.destroy(this.metadataQuerier);
    }

    return data;
  }

  /**
   * @param {Decoder} decoder
   * @param {*} dracoGeometry
   * @param {*} geometryType
   * @param {*} geometry
   * @param {object} options
   */
  _extractDRACOGeometry(decoder, dracoGeometry, geometryType, geometry, options) {
    const attributes = this._getAttributes(decoder, dracoGeometry, options);

    const positionAttribute = attributes.POSITION;
    if (!positionAttribute) {
      throw new Error('DRACO decompressor: No position attribute found.');
    }

    // For meshes, we need indices to define the faces.
    if (geometryType === this.draco.TRIANGULAR_MESH) {
      attributes.indices =
        this.drawMode === 'TRIANGLE_STRIP'
          ? /**
             *
             * @param {*} decoder
             * @param {*} dracoGeometry
             */
            this._getMeshStripIndices(decoder, dracoGeometry)
          : this._getMeshFaceIndices(decoder, dracoGeometry);
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

  _getAttributes(decoder, dracoGeometry, options) {
    const attributes = {};
    const numPoints = dracoGeometry.num_points();
    // const attributeUniqueIdMap = {};

    // Note: Draco docs do not seem clear on `GetAttribute` accepting a zero-based index,
    // but it seems to work this way
    for (let attributeId = 0; attributeId < dracoGeometry.num_attributes(); attributeId++) {
      const dracoAttribute = decoder.GetAttribute(dracoGeometry, attributeId);
      const attributeMetadata = this._getAttributeMetadata(decoder, dracoGeometry, attributeId);
      const attributeData = {
        uniqueId: dracoAttribute.unique_id(),
        attributeType: dracoAttribute.attribute_type(),
        dataType: DRACO_DATA_TYPE_TO_TYPED_ARRAY_MAP[dracoAttribute.data_type()],
        size: dracoAttribute.size(),
        numComponents: dracoAttribute.num_components(),
        byteOffset: dracoAttribute.byte_offset(),
        byteStride: dracoAttribute.byte_stride(),
        normalized: dracoAttribute.normalized(),
        metadata: attributeMetadata
      };

      // DRACO does not store attribute names - We need to deduce an attribute name
      const attributeName = this._deduceAttributeName(attributeData, options);

      const {typedArray} = this._getAttributeTypedArray(
        decoder,
        dracoGeometry,
        dracoAttribute,
        attributeName
      );
      attributes[attributeName] = {
        value: typedArray,
        size: typedArray.length / numPoints,
        metadata: attributeMetadata
      };
    }

    return attributes;
  }

  /**
   * For meshes, we need indices to define the faces.
   * @param {Decoder} decoder
   * @param {*} dracoGeometry
   */
  _getMeshFaceIndices(decoder, dracoGeometry) {
    // Example on how to retrieve mesh and attributes.
    const numFaces = dracoGeometry.num_faces();
    const numIndices = numFaces * 3;
    const byteLength = numIndices * INDEX_ITEM_SIZE;

    const ptr = this.draco._malloc(byteLength);
    decoder.GetTrianglesUInt32Array(dracoGeometry, byteLength, ptr);
    const indices = new Uint32Array(this.draco.HEAPF32.buffer, ptr, numIndices).slice();
    this.draco._free(ptr);

    return indices;
  }

  /**
   * For meshes, we need indices to define the faces.
   * @param {Decoder} decoder
   * @param {*} dracoGeometry
   */
  _getMeshStripIndices(decoder, dracoGeometry) {
    const dracoArray = new this.draco.DracoInt32Array();
    /* const numStrips = */ decoder.GetTriangleStripsFromMesh(dracoGeometry, dracoArray);
    const indices = new Uint32Array(dracoArray.size());
    for (let i = 0; i < dracoArray.size(); ++i) {
      indices[i] = dracoArray.GetValue(i);
    }
    this.draco.destroy(dracoArray);
    return indices;
  }

  /**
   *
   * @param {Decoder} decoder
   * @param {*} dracoGeometry
   * @param {*} dracoAttribute
   * @param {*} attributeName
   */
  _getAttributeTypedArray(decoder, dracoGeometry, dracoAttribute, attributeName) {
    if (dracoAttribute.ptr === 0) {
      const message = `DRACO decode bad attribute ${attributeName}`;
      // console.error(message);
      throw new Error(message);
    }

    const TypedArrayCtor = DRACO_DATA_TYPE_TO_TYPED_ARRAY_MAP[dracoAttribute.data_type()];
    const numComponents = dracoAttribute.num_components();
    const numPoints = dracoGeometry.num_points();
    const numValues = numPoints * numComponents;

    const byteLength = numValues * TypedArrayCtor.BYTES_PER_ELEMENT;
    const dataType = this._getDracoDataType(TypedArrayCtor);

    const ptr = this.draco._malloc(byteLength);
    decoder.GetAttributeDataArrayForAllPoints(
      dracoGeometry,
      dracoAttribute,
      dataType,
      byteLength,
      ptr
    );
    const typedArray = new TypedArrayCtor(this.draco.HEAPF32.buffer, ptr, numValues).slice();
    this.draco._free(ptr);

    return {typedArray, components: numComponents};
  }

  /**
   * Get draco specific data type by TypedArray constructor type
   * @param {*} attributeType
   * @returns {number} draco specific data type
   */
  _getDracoDataType(attributeType) {
    switch (
      attributeType // eslint-disable-line default-case
    ) {
      case Float32Array:
        return this.draco.DT_FLOAT32;
      case Int8Array:
        return this.draco.DT_INT8;
      case Int16Array:
        return this.draco.DT_INT16;
      case Int32Array:
        return this.draco.DT_INT32;
      case Uint8Array:
        return this.draco.DT_UINT8;
      case Uint16Array:
        return this.draco.DT_UINT16;
      case Uint32Array:
        return this.draco.DT_UINT32;
      default:
        return this.draco.DT_INVALID;
    }
  }

  /**
   * Deduce an attribute name.
   * @note DRACO does not save attribute names, just general type (POSITION, COLOR)
   * to help optimize compression. We generate GLTF compatible names for the Draco-recognized
   * types
   * @param {object} attributeData
   */
  _deduceAttributeName(attributeData, options) {
    const {extraAttributes = {}} = options;
    if (extraAttributes && typeof extraAttributes === 'object') {
      for (const [attributeName, attributeUniqueId] of Object.entries(extraAttributes)) {
        if (attributeUniqueId === attributeData.uniqueId) {
          return attributeName;
        }
      }
    }

    for (const dracoAttributeConstant in DRACO_TO_GLTF_ATTRIBUTE_NAME_MAP) {
      const attributeType = this.draco[dracoAttributeConstant];
      if (attributeData.attributeType === attributeType) {
        // TODO - Return unique names if there multiple attributes per type
        // (e.g. multiple TEX_COORDS or COLORS)
        return DRACO_TO_GLTF_ATTRIBUTE_NAME_MAP[dracoAttributeConstant];
      }
    }

    if (attributeData.metadata) {
      const entryName = options.attributeNameEntry || 'name';
      if (attributeData.metadata[entryName]) {
        return attributeData.metadata[entryName].string;
      }
    }

    // Attribute of "GENERIC" type, we need to assign some name
    return `CUSTOM_ATTRIBUTE_${attributeData.uniqueId}`;
  }

  _getGeometryMetadata(decoder, dracoGeometry) {
    const dracoMetadata = decoder.GetMetadata(dracoGeometry);
    return this._queryDracoMetadata(dracoMetadata);
  }

  _getAttributeMetadata(decoder, dracoGeometry, attributeId) {
    const dracoMetadata = decoder.GetAttributeMetadata(dracoGeometry, attributeId);
    return this._queryDracoMetadata(dracoMetadata);
  }

  // The not so wonderful world of undocumented Draco APIs :(
  _queryDracoMetadata(dracoMetadata) {
    if (!dracoMetadata || !dracoMetadata.ptr) {
      return {};
    }
    const result = {};
    const numEntries = this.metadataQuerier.NumEntries(dracoMetadata);
    const dracoArray = new this.draco.DracoInt32Array();
    for (let entryIndex = 0; entryIndex < numEntries; entryIndex++) {
      const entryName = this.metadataQuerier.GetEntryName(dracoMetadata, entryIndex);
      this.metadataQuerier.GetIntEntryArray(dracoMetadata, entryName, dracoArray);
      const numValues = dracoArray.size();
      const intArray = new Int32Array(numValues);
      for (let i = 0; i < numValues; i++) {
        intArray[i] = dracoArray.GetValue(i);
      }
      result[entryName] = {
        int: this.metadataQuerier.GetIntEntry(dracoMetadata, entryName),
        string: this.metadataQuerier.GetStringEntry(dracoMetadata, entryName),
        double: this.metadataQuerier.GetDoubleEntry(dracoMetadata, entryName),
        intArray
      };
    }
    this.draco.destroy(dracoArray);
    return result;
  }
}
