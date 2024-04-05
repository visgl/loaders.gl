/* eslint-disable camelcase */

import type {TypedArray, MeshAttribute, MeshGeometry} from '@loaders.gl/schema';

// Draco types (input)
import type {
  Draco3D,
  Decoder,
  Mesh,
  PointCloud,
  PointAttribute,
  Metadata,
  MetadataQuerier,
  DracoInt32Array,
  draco_DataType
} from '../draco3d/draco3d-types';

// Parsed data types (output)
import type {
  DracoMesh,
  DracoLoaderData,
  DracoAttribute,
  DracoMetadataEntry,
  DracoQuantizationTransform,
  DracoOctahedronTransform
} from './draco-types';

import {getMeshBoundingBox} from '@loaders.gl/schema';
import {getDracoSchema} from './utils/get-draco-schema';

/** Options to control draco parsing */
export type DracoParseOptions = {
  /** How triangle indices should be generated (mesh only) */
  topology?: 'triangle-list' | 'triangle-strip';
  /** Specify which attribute metadata entry stores the attribute name */
  attributeNameEntry?: string;
  /** Names and ids of extra attributes to include in the output */
  extraAttributes?: {[uniqueId: string]: number};
  /** Skip transforms specific quantized attributes */
  quantizedAttributes?: ('POSITION' | 'NORMAL' | 'COLOR' | 'TEX_COORD' | 'GENERIC')[];
  /** Skip transforms specific octahedron encoded  attributes */
  octahedronAttributes?: ('POSITION' | 'NORMAL' | 'COLOR' | 'TEX_COORD' | 'GENERIC')[];
};

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // 7: BigInt64Array,
  // 8: BigUint64Array,
  9: Float32Array
  // 10: Float64Array
  // 11: BOOL - What array type do we use for this?
};

const INDEX_ITEM_SIZE = 4;

export default class DracoParser {
  draco: Draco3D;
  decoder: Decoder;
  metadataQuerier: MetadataQuerier;

  // draco - the draco decoder, either import `draco3d` or load dynamically
  constructor(draco: Draco3D) {
    this.draco = draco;
    this.decoder = new this.draco.Decoder();
    this.metadataQuerier = new this.draco.MetadataQuerier();
  }

  /**
   * Destroy draco resources
   */
  destroy(): void {
    this.draco.destroy(this.decoder);
    this.draco.destroy(this.metadataQuerier);
  }

  /**
   * NOTE: caller must call `destroyGeometry` on the return value after using it
   * @param arrayBuffer
   * @param options
   */
  parseSync(arrayBuffer: ArrayBuffer, options: DracoParseOptions = {}): DracoMesh {
    const buffer = new this.draco.DecoderBuffer();
    buffer.Init(new Int8Array(arrayBuffer), arrayBuffer.byteLength);

    this._disableAttributeTransforms(options);

    const geometry_type = this.decoder.GetEncodedGeometryType(buffer);
    const dracoGeometry =
      geometry_type === this.draco.TRIANGULAR_MESH
        ? new this.draco.Mesh()
        : new this.draco.PointCloud();

    try {
      let dracoStatus;
      switch (geometry_type) {
        case this.draco.TRIANGULAR_MESH:
          dracoStatus = this.decoder.DecodeBufferToMesh(buffer, dracoGeometry as Mesh);
          break;

        case this.draco.POINT_CLOUD:
          dracoStatus = this.decoder.DecodeBufferToPointCloud(buffer, dracoGeometry);
          break;

        default:
          throw new Error('DRACO: Unknown geometry type.');
      }

      if (!dracoStatus.ok() || !dracoGeometry.ptr) {
        const message = `DRACO decompression failed: ${dracoStatus.error_msg()}`;
        // console.error(message);
        throw new Error(message);
      }

      const loaderData = this._getDracoLoaderData(dracoGeometry, geometry_type, options);

      const geometry = this._getMeshData(dracoGeometry, loaderData, options);

      const boundingBox = getMeshBoundingBox(geometry.attributes);

      const schema = getDracoSchema(geometry.attributes, loaderData, geometry.indices);

      const data: DracoMesh = {
        loader: 'draco',
        loaderData,
        header: {
          vertexCount: dracoGeometry.num_points(),
          boundingBox
        },
        ...geometry,
        schema
      };
      return data;
    } finally {
      this.draco.destroy(buffer);
      if (dracoGeometry) {
        this.draco.destroy(dracoGeometry);
      }
    }
  }

  // Draco specific "loader data"

  /**
   * Extract
   * @param dracoGeometry
   * @param geometry_type
   * @param options
   * @returns
   */
  _getDracoLoaderData(
    dracoGeometry: Mesh | PointCloud,
    geometry_type,
    options: DracoParseOptions
  ): DracoLoaderData {
    const metadata = this._getTopLevelMetadata(dracoGeometry);
    const attributes = this._getDracoAttributes(dracoGeometry, options);

    return {
      geometry_type,
      num_attributes: dracoGeometry.num_attributes(),
      num_points: dracoGeometry.num_points(),
      num_faces: dracoGeometry instanceof this.draco.Mesh ? dracoGeometry.num_faces() : 0,
      metadata,
      attributes
    };
  }

  /**
   * Extract all draco provided information and metadata for each attribute
   * @param dracoGeometry
   * @param options
   * @returns
   */
  _getDracoAttributes(
    dracoGeometry: Mesh | PointCloud,
    options: DracoParseOptions
  ): {[unique_id: number]: DracoAttribute} {
    const dracoAttributes: {[unique_id: number]: DracoAttribute} = {};

    for (let attributeId = 0; attributeId < dracoGeometry.num_attributes(); attributeId++) {
      // Note: Draco docs do not seem clear on `GetAttribute` ids just being a zero-based index,
      // but it does seems to work this way
      const dracoAttribute = this.decoder.GetAttribute(dracoGeometry, attributeId);

      const metadata = this._getAttributeMetadata(dracoGeometry, attributeId);

      dracoAttributes[dracoAttribute.unique_id()] = {
        unique_id: dracoAttribute.unique_id(),
        attribute_type: dracoAttribute.attribute_type(),
        data_type: dracoAttribute.data_type(),
        num_components: dracoAttribute.num_components(),

        byte_offset: dracoAttribute.byte_offset(),
        byte_stride: dracoAttribute.byte_stride(),
        normalized: dracoAttribute.normalized(),
        attribute_index: attributeId,

        metadata
      };

      // Add transformation parameters for any attributes app wants untransformed
      const quantization = this._getQuantizationTransform(dracoAttribute, options);
      if (quantization) {
        dracoAttributes[dracoAttribute.unique_id()].quantization_transform = quantization;
      }

      const octahedron = this._getOctahedronTransform(dracoAttribute, options);
      if (octahedron) {
        dracoAttributes[dracoAttribute.unique_id()].octahedron_transform = octahedron;
      }
    }

    return dracoAttributes;
  }

  /**
   * Get standard loaders.gl mesh category data
   * Extracts the geometry from draco
   * @param dracoGeometry
   * @param options
   */
  _getMeshData(
    dracoGeometry: Mesh | PointCloud,
    loaderData: DracoLoaderData,
    options: DracoParseOptions
  ): MeshGeometry {
    const attributes = this._getMeshAttributes(loaderData, dracoGeometry, options);

    const positionAttribute = attributes.POSITION;
    if (!positionAttribute) {
      throw new Error('DRACO: No position attribute found.');
    }

    // For meshes, we need indices to define the faces.
    if (dracoGeometry instanceof this.draco.Mesh) {
      switch (options.topology) {
        case 'triangle-strip':
          return {
            topology: 'triangle-strip',
            mode: 4, // GL.TRIANGLES
            attributes,
            indices: {
              value: this._getTriangleStripIndices(dracoGeometry),
              size: 1
            }
          };
        case 'triangle-list':
        default:
          return {
            topology: 'triangle-list',
            mode: 5, // GL.TRIANGLE_STRIP
            attributes,
            indices: {
              value: this._getTriangleListIndices(dracoGeometry),
              size: 1
            }
          };
      }
    }

    // PointCloud - must come last as Mesh inherits from PointCloud
    return {
      topology: 'point-list',
      mode: 0, // GL.POINTS
      attributes
    };
  }

  _getMeshAttributes(
    loaderData: DracoLoaderData,
    dracoGeometry: Mesh | PointCloud,
    options: DracoParseOptions
  ): {[attributeName: string]: MeshAttribute} {
    const attributes: {[key: string]: MeshAttribute} = {};

    for (const loaderAttribute of Object.values(loaderData.attributes)) {
      const attributeName = this._deduceAttributeName(loaderAttribute, options);
      loaderAttribute.name = attributeName;
      const values = this._getAttributeValues(dracoGeometry, loaderAttribute);
      if (values) {
        const {value, size} = values;
        attributes[attributeName] = {
          value,
          size,
          byteOffset: loaderAttribute.byte_offset,
          byteStride: loaderAttribute.byte_stride,
          normalized: loaderAttribute.normalized
        };
      }
    }

    return attributes;
  }

  // MESH INDICES EXTRACTION

  /**
   * For meshes, we need indices to define the faces.
   * @param dracoGeometry
   */
  _getTriangleListIndices(dracoGeometry: Mesh) {
    // Example on how to retrieve mesh and attributes.
    const numFaces = dracoGeometry.num_faces();
    const numIndices = numFaces * 3;
    const byteLength = numIndices * INDEX_ITEM_SIZE;

    const ptr = this.draco._malloc(byteLength);
    try {
      this.decoder.GetTrianglesUInt32Array(dracoGeometry, byteLength, ptr);
      return new Uint32Array(this.draco.HEAPF32.buffer, ptr, numIndices).slice();
    } finally {
      this.draco._free(ptr);
    }
  }

  /**
   * For meshes, we need indices to define the faces.
   * @param dracoGeometry
   */
  _getTriangleStripIndices(dracoGeometry: Mesh) {
    const dracoArray = new this.draco.DracoInt32Array();
    try {
      /* const numStrips = */ this.decoder.GetTriangleStripsFromMesh(dracoGeometry, dracoArray);
      return getUint32Array(dracoArray);
    } finally {
      this.draco.destroy(dracoArray);
    }
  }

  /**
   *
   * @param dracoGeometry
   * @param dracoAttribute
   * @param attributeName
   */
  _getAttributeValues(
    dracoGeometry: Mesh | PointCloud,
    attribute: DracoAttribute
  ): {value: TypedArray; size: number} | null {
    const TypedArrayCtor = DRACO_DATA_TYPE_TO_TYPED_ARRAY_MAP[attribute.data_type];
    if (!TypedArrayCtor) {
      // eslint-disable-next-line no-console
      console.warn(`DRACO: Unsupported attribute type ${attribute.data_type}`);
      return null;
    }
    const numComponents = attribute.num_components;
    const numPoints = dracoGeometry.num_points();
    const numValues = numPoints * numComponents;

    const byteLength = numValues * TypedArrayCtor.BYTES_PER_ELEMENT;
    const dataType = getDracoDataType(this.draco, TypedArrayCtor);

    let value: TypedArray;

    const ptr = this.draco._malloc(byteLength);
    try {
      const dracoAttribute = this.decoder.GetAttribute(dracoGeometry, attribute.attribute_index);
      this.decoder.GetAttributeDataArrayForAllPoints(
        dracoGeometry,
        dracoAttribute,
        dataType,
        byteLength,
        ptr
      );
      value = new TypedArrayCtor(this.draco.HEAPF32.buffer, ptr, numValues).slice();
    } finally {
      this.draco._free(ptr);
    }

    return {value, size: numComponents};
  }

  // Attribute names

  /** 
   * DRACO does not store attribute names - We need to deduce an attribute name
   * for each attribute
  _getAttributeNames(
    dracoGeometry: Mesh | PointCloud,
    options: DracoParseOptions
  ): {[unique_id: number]: string} {
    const attributeNames: {[unique_id: number]: string} = {};
    for (let attributeId = 0; attributeId < dracoGeometry.num_attributes(); attributeId++) {
      const dracoAttribute = this.decoder.GetAttribute(dracoGeometry, attributeId);
      const attributeName = this._deduceAttributeName(dracoAttribute, options);
      attributeNames[attributeName] = attributeName;
    }
    return attributeNames;
  }
   */

  /**
   * Deduce an attribute name.
   * @note DRACO does not save attribute names, just general type (POSITION, COLOR)
   * to help optimize compression. We generate GLTF compatible names for the Draco-recognized
   * types
   * @param attributeData
   */
  _deduceAttributeName(attribute: DracoAttribute, options: DracoParseOptions): string {
    // Deduce name based on application provided map
    const uniqueId = attribute.unique_id;
    for (const [attributeName, attributeUniqueId] of Object.entries(
      options.extraAttributes || {}
    )) {
      if (attributeUniqueId === uniqueId) {
        return attributeName;
      }
    }

    // Deduce name based on attribute type
    const thisAttributeType = attribute.attribute_type;
    for (const dracoAttributeConstant in DRACO_TO_GLTF_ATTRIBUTE_NAME_MAP) {
      const attributeType = this.draco[dracoAttributeConstant];
      if (attributeType === thisAttributeType) {
        // TODO - Return unique names if there multiple attributes per type
        // (e.g. multiple TEX_COORDS or COLORS)
        return DRACO_TO_GLTF_ATTRIBUTE_NAME_MAP[dracoAttributeConstant];
      }
    }

    // Look up in metadata
    // TODO - shouldn't this have priority?
    const entryName = options.attributeNameEntry || 'name';
    if (attribute.metadata[entryName]) {
      return attribute.metadata[entryName].string;
    }

    // Attribute of "GENERIC" type, we need to assign some name
    return `CUSTOM_ATTRIBUTE_${uniqueId}`;
  }

  // METADATA EXTRACTION

  /** Get top level metadata */
  _getTopLevelMetadata(dracoGeometry: Mesh | PointCloud) {
    const dracoMetadata = this.decoder.GetMetadata(dracoGeometry);
    return this._getDracoMetadata(dracoMetadata);
  }

  /** Get per attribute metadata */
  _getAttributeMetadata(dracoGeometry: Mesh | PointCloud, attributeId: number) {
    const dracoMetadata = this.decoder.GetAttributeMetadata(dracoGeometry, attributeId);
    return this._getDracoMetadata(dracoMetadata);
  }

  /**
   * Extract metadata field values
   * @param dracoMetadata
   * @returns
   */
  _getDracoMetadata(dracoMetadata: Metadata): {[entry: string]: DracoMetadataEntry} {
    // The not so wonderful world of undocumented Draco APIs :(
    if (!dracoMetadata || !dracoMetadata.ptr) {
      return {};
    }
    const result = {};
    const numEntries = this.metadataQuerier.NumEntries(dracoMetadata);
    for (let entryIndex = 0; entryIndex < numEntries; entryIndex++) {
      const entryName = this.metadataQuerier.GetEntryName(dracoMetadata, entryIndex);
      result[entryName] = this._getDracoMetadataField(dracoMetadata, entryName);
    }
    return result;
  }

  /**
   * Extracts possible values for one metadata entry by name
   * @param dracoMetadata
   * @param entryName
   */
  _getDracoMetadataField(dracoMetadata: Metadata, entryName: string): DracoMetadataEntry {
    const dracoArray = new this.draco.DracoInt32Array();
    try {
      // Draco metadata fields can hold int32 arrays
      this.metadataQuerier.GetIntEntryArray(dracoMetadata, entryName, dracoArray);
      const intArray = getInt32Array(dracoArray);
      return {
        int: this.metadataQuerier.GetIntEntry(dracoMetadata, entryName),
        string: this.metadataQuerier.GetStringEntry(dracoMetadata, entryName),
        double: this.metadataQuerier.GetDoubleEntry(dracoMetadata, entryName),
        intArray
      };
    } finally {
      this.draco.destroy(dracoArray);
    }
  }

  // QUANTIZED ATTRIBUTE SUPPORT (NO DECOMPRESSION)

  /** Skip transforms for specific attribute types */
  _disableAttributeTransforms(options: DracoParseOptions) {
    const {quantizedAttributes = [], octahedronAttributes = []} = options;
    const skipAttributes = [...quantizedAttributes, ...octahedronAttributes];
    for (const dracoAttributeName of skipAttributes) {
      this.decoder.SkipAttributeTransform(this.draco[dracoAttributeName]);
    }
  }

  /**
   * Extract (and apply?) Position Transform
   * @todo not used
   */
  _getQuantizationTransform(
    dracoAttribute: PointAttribute,
    options: DracoParseOptions
  ): DracoQuantizationTransform | null {
    const {quantizedAttributes = []} = options;
    const attribute_type = dracoAttribute.attribute_type();
    const skip = quantizedAttributes.map((type) => this.decoder[type]).includes(attribute_type);
    if (skip) {
      const transform = new this.draco.AttributeQuantizationTransform();
      try {
        if (transform.InitFromAttribute(dracoAttribute)) {
          return {
            quantization_bits: transform.quantization_bits(),
            range: transform.range(),
            min_values: new Float32Array([1, 2, 3]).map((i) => transform.min_value(i))
          };
        }
      } finally {
        this.draco.destroy(transform);
      }
    }
    return null;
  }

  _getOctahedronTransform(
    dracoAttribute: PointAttribute,
    options: DracoParseOptions
  ): DracoOctahedronTransform | null {
    const {octahedronAttributes = []} = options;
    const attribute_type = dracoAttribute.attribute_type();
    const octahedron = octahedronAttributes
      .map((type) => this.decoder[type])
      .includes(attribute_type);
    if (octahedron) {
      const transform = new this.draco.AttributeQuantizationTransform();
      try {
        if (transform.InitFromAttribute(dracoAttribute)) {
          return {
            quantization_bits: transform.quantization_bits()
          };
        }
      } finally {
        this.draco.destroy(transform);
      }
    }
    return null;
  }

  // HELPERS
}

/**
 * Get draco specific data type by TypedArray constructor type
 * @param attributeType
 * @returns draco specific data type
 */
function getDracoDataType(draco: Draco3D, attributeType: any): draco_DataType {
  switch (attributeType) {
    case Float32Array:
      return draco.DT_FLOAT32;
    case Int8Array:
      return draco.DT_INT8;
    case Int16Array:
      return draco.DT_INT16;
    case Int32Array:
      return draco.DT_INT32;
    case Uint8Array:
      return draco.DT_UINT8;
    case Uint16Array:
      return draco.DT_UINT16;
    case Uint32Array:
      return draco.DT_UINT32;
    default:
      return draco.DT_INVALID;
  }
}

/**
 * Copy a Draco int32 array into a JS typed array
 */
function getInt32Array(dracoArray: DracoInt32Array): Int32Array {
  const numValues = dracoArray.size();
  const intArray = new Int32Array(numValues);
  for (let i = 0; i < numValues; i++) {
    intArray[i] = dracoArray.GetValue(i);
  }
  return intArray;
}

/**
 * Copy a Draco int32 array into a JS typed array
 */
function getUint32Array(dracoArray: DracoInt32Array): Int32Array {
  const numValues = dracoArray.size();
  const intArray = new Int32Array(numValues);
  for (let i = 0; i < numValues; i++) {
    intArray[i] = dracoArray.GetValue(i);
  }
  return intArray;
}
