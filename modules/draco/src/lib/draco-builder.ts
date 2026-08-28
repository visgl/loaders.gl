// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */
// This code is inspired by example code in the DRACO repository
import type {
  Draco3D,
  DracoInt8Array,
  Encoder,
  ExpertEncoder,
  Mesh,
  MeshBuilder,
  PointCloud,
  Metadata,
  MetadataBuilder,
  draco_GeometryAttribute_Type
} from '../draco3d/draco3d-types';

import type {MeshAttribute, TypedArray} from '@loaders.gl/schema';

/** Geometry accepted by the low-level Draco encoder. */
export type DracoBuilderMesh = {
  /** Vertex attributes keyed by semantic or application attribute name. */
  attributes: Record<string, TypedArray | MeshAttribute>;
  /** Optional triangle indices. */
  indices?: TypedArray | MeshAttribute;
};

/** Metadata values supported by the Draco WebAssembly API. */
export type DracoMetadata = Record<string, string | number | Int32Array>;

/** Draco mesh encoding method exposed by the WebAssembly encoder. */
export type DracoEncodingMethod = 'MESH_EDGEBREAKER_ENCODING' | 'MESH_SEQUENTIAL_ENCODING';

/** Draco attribute categories used to select compression transforms. */
export type DracoAttributeType = 'POSITION' | 'NORMAL' | 'COLOR' | 'TEX_COORD' | 'GENERIC';

/** Explicit quantization transform for one Draco attribute. */
export type DracoExplicitQuantization = {
  /** Number of quantization bits, from 1 through 30. */
  bits: number;
  /** Quantization origin, with one finite value per attribute component. */
  origin: number[];
  /** Positive finite quantization range shared by every component. */
  range: number;
};

/** Per-attribute quantization, expressed as a bit count or an explicit transform. */
export type DracoAttributeQuantization = number | DracoExplicitQuantization;

/** Named compression profile for common glTF and GPU workloads. */
export type DracoEncodingPreset = 'gltf' | 'webgpu' | 'balanced';

/** Per-attribute details captured after constructing a Draco geometry. */
export type DracoEncodingAttributeReport = {
  /** Unique attribute identifier stored in the Draco geometry. */
  id: number;
  /** Draco compression category. */
  type: DracoAttributeType;
  /** Number of scalar components per attribute value. */
  componentCount: number;
  /** Configured quantization, omitted when Draco defaults are used. */
  quantization?: DracoAttributeQuantization;
};

/** Diagnostics reported for one completed Draco encoding. */
export type DracoEncodingReport = {
  /** Encoded geometry kind. */
  geometryType: 'mesh' | 'point-cloud';
  /** Encoded output size in bytes. */
  byteLength: number;
  /** Point count reported by the native encoder. */
  pointCount: number;
  /** Face count reported by the native encoder. */
  faceCount: number;
  /** Number of encoded vertex attributes. */
  attributeCount: number;
  /** Explicit encoding method, omitted when Draco selects its default. */
  method?: DracoEncodingMethod;
  /** Explicit encoder speed settings, omitted when Draco selects its defaults. */
  speed?: [number, number];
  /** Encoded attributes keyed by application attribute name. */
  attributes: Record<string, DracoEncodingAttributeReport>;
};

/** Encoded Draco bytes and diagnostics from the same native operation. */
export type DracoEncodingResult = {
  /** Encoded Draco bytes. */
  data: ArrayBuffer;
  /** Encoding diagnostics. */
  report: DracoEncodingReport;
};

export type DracoBuildOptions = {
  pointcloud?: boolean;
  /** Deduplicate identical point-cloud attribute tuples before encoding. */
  deduplicateValues?: boolean;
  /** Metadata key used to preserve application attribute names. */
  attributeNameEntry?: string;
  /** Explicit Draco attribute categories keyed by application attribute name. */
  attributeTypes?: Record<string, DracoAttributeType>;
  metadata?: DracoMetadata;
  attributesMetadata?: Record<string, DracoMetadata>;
  log?: (message: string) => void;

  // draco encoding options
  speed?: [number, number];
  method?: DracoEncodingMethod;
  /** Quantization bits keyed by Draco attribute category. */
  quantization?: Partial<Record<DracoAttributeType, number>>;
  /** Quantization keyed by application attribute name, overriding category settings. */
  attributeQuantization?: Record<string, DracoAttributeQuantization>;
  /** Applies a documented set of compression defaults before explicit options. */
  preset?: DracoEncodingPreset;
};

type DracoBuilderAttributeInfo = {
  /** Unique attribute identifier assigned by Draco's geometry builder. */
  attributeId: number;
  /** Draco compression category for the attribute. */
  attributeType: draco_GeometryAttribute_Type;
  /** Public name of the Draco compression category. */
  attributeTypeName: DracoAttributeType;
  /** Number of scalar components in each attribute value. */
  componentCount: number;
  /** Whether Draco can apply a lossy quantization transform to the source values. */
  supportsQuantization: boolean;
};

// Native Draco attribute names to GLTF attribute names.
const GLTF_TO_DRACO_ATTRIBUTE_NAME_MAP = {
  POSITION: 'POSITION',
  NORMAL: 'NORMAL',
  COLOR_0: 'COLOR',
  TEXCOORD_0: 'TEX_COORD'
} as const satisfies Record<string, DracoAttributeType>;

const noop = () => {};

export default class DracoBuilder {
  draco: Draco3D;
  dracoEncoder: Encoder;
  dracoMeshBuilder: MeshBuilder;
  dracoMetadataBuilder: MetadataBuilder;
  log: (message: string) => void = noop;

  // draco - the draco decoder, either import `draco3d` or load dynamically
  constructor(draco: Draco3D) {
    this.draco = draco;
    this.dracoEncoder = new this.draco.Encoder();
    this.dracoMeshBuilder = new this.draco.MeshBuilder();
    this.dracoMetadataBuilder = new this.draco.MetadataBuilder();
  }

  destroy(): void {
    this.destroyEncodedObject(this.dracoMeshBuilder);
    this.destroyEncodedObject(this.dracoEncoder);
    this.destroyEncodedObject(this.dracoMetadataBuilder);
  }

  // TBD - when does this need to be called?
  destroyEncodedObject(object: unknown): void {
    if (object) {
      this.draco.destroy(object);
    }
  }

  /**
   * Encode mesh or point cloud
   * @param mesh =({})
   * @param options
   */
  encodeSync(mesh: DracoBuilderMesh, options: DracoBuildOptions = {}): ArrayBuffer {
    return this._encodeSync(mesh, options, false).data;
  }

  /** Encodes a mesh or point cloud and returns native encoding diagnostics. */
  encodeSyncWithReport(
    mesh: DracoBuilderMesh,
    options: DracoBuildOptions = {}
  ): DracoEncodingResult {
    return this._encodeSync(mesh, options, true);
  }

  /** Shared implementation for ordinary encoding and report-producing encoding. */
  _encodeSync(
    mesh: DracoBuilderMesh,
    options: DracoBuildOptions,
    trackEncodedProperties: boolean
  ): DracoEncodingResult {
    options = applyDracoEncodingPreset(options);
    this.log = options.log || noop;

    return options.pointcloud
      ? this._encodePointCloud(mesh, options, trackEncodedProperties)
      : this._encodeMesh(mesh, options, trackEncodedProperties);
  }

  // PRIVATE

  _getAttributesFromMesh(mesh: DracoBuilderMesh): Record<string, TypedArray | MeshAttribute> {
    return {
      ...(mesh.indices ? {indices: mesh.indices} : {}),
      ...mesh.attributes
    };
  }

  _encodePointCloud(
    pointcloud: DracoBuilderMesh,
    options: DracoBuildOptions,
    trackEncodedProperties: boolean
  ): DracoEncodingResult {
    const dracoPointCloud = new this.draco.PointCloud();
    const dracoData = new this.draco.DracoInt8Array();
    let expertEncoder: ExpertEncoder | null = null;

    try {
      if (options.metadata) {
        this._addGeometryMetadata(dracoPointCloud, options.metadata);
      }
      const attributes = this._getAttributesFromMesh(pointcloud);
      const attributeInfo = this._createDracoPointCloud(dracoPointCloud, attributes, options);
      const useExpertEncoder = hasAttributeQuantization(options);
      let encodedLen: number;
      let activeEncoder: Encoder | ExpertEncoder;
      if (useExpertEncoder) {
        expertEncoder = new this.draco.ExpertEncoder(dracoPointCloud);
        this._setExpertOptions(expertEncoder, attributeInfo, options);
        activeEncoder = expertEncoder;
        if (trackEncodedProperties) {
          activeEncoder.SetTrackEncodedProperties(true);
        }
        encodedLen = expertEncoder.EncodeToDracoBuffer(
          options.deduplicateValues ?? false,
          dracoData
        );
      } else {
        this._setOptions(options);
        activeEncoder = this.dracoEncoder;
        if (trackEncodedProperties) {
          activeEncoder.SetTrackEncodedProperties(true);
        }
        encodedLen = this.dracoEncoder.EncodePointCloudToDracoBuffer(
          dracoPointCloud,
          options.deduplicateValues ?? false,
          dracoData
        );
      }

      if (!(encodedLen > 0)) {
        throw new Error('Draco encoding failed.');
      }

      this.log(`DRACO encoded ${dracoPointCloud.num_points()} points
        with ${dracoPointCloud.num_attributes()} attributes into ${encodedLen} bytes`);

      const data = dracoInt8ArrayToArrayBuffer(dracoData);
      return {
        data,
        report: this._getEncodingReport(
          'point-cloud',
          data.byteLength,
          dracoPointCloud,
          activeEncoder,
          attributeInfo,
          options,
          trackEncodedProperties
        )
      };
    } finally {
      this.destroyEncodedObject(expertEncoder);
      this.destroyEncodedObject(dracoData);
      this.destroyEncodedObject(dracoPointCloud);
    }
  }

  _encodeMesh(
    mesh: DracoBuilderMesh,
    options: DracoBuildOptions,
    trackEncodedProperties: boolean
  ): DracoEncodingResult {
    const dracoMesh = new this.draco.Mesh();
    const dracoData = new this.draco.DracoInt8Array();
    let expertEncoder: ExpertEncoder | null = null;

    try {
      if (options.metadata) {
        this._addGeometryMetadata(dracoMesh, options.metadata);
      }
      const attributes = this._getAttributesFromMesh(mesh);
      const attributeInfo = this._createDracoMesh(dracoMesh, attributes, options);
      const useExpertEncoder = hasAttributeQuantization(options);
      let encodedLen: number;
      let activeEncoder: Encoder | ExpertEncoder;
      if (useExpertEncoder) {
        expertEncoder = new this.draco.ExpertEncoder(dracoMesh);
        this._setExpertOptions(expertEncoder, attributeInfo, options);
        activeEncoder = expertEncoder;
        if (trackEncodedProperties) {
          activeEncoder.SetTrackEncodedProperties(true);
        }
        encodedLen = expertEncoder.EncodeToDracoBuffer(false, dracoData);
      } else {
        this._setOptions(options);
        activeEncoder = this.dracoEncoder;
        if (trackEncodedProperties) {
          activeEncoder.SetTrackEncodedProperties(true);
        }
        encodedLen = this.dracoEncoder.EncodeMeshToDracoBuffer(dracoMesh, dracoData);
      }
      if (encodedLen <= 0) {
        throw new Error('Draco encoding failed.');
      }

      this.log(`DRACO encoded ${dracoMesh.num_points()} points
        with ${dracoMesh.num_attributes()} attributes into ${encodedLen} bytes`);

      const data = dracoInt8ArrayToArrayBuffer(dracoData);
      return {
        data,
        report: this._getEncodingReport(
          'mesh',
          data.byteLength,
          dracoMesh,
          activeEncoder,
          attributeInfo,
          options,
          trackEncodedProperties
        )
      };
    } finally {
      this.destroyEncodedObject(expertEncoder);
      this.destroyEncodedObject(dracoData);
      this.destroyEncodedObject(dracoMesh);
    }
  }

  /** Applies encoder speed, method, and quantization options. */
  _setOptions(options: DracoBuildOptions): void {
    if (options.speed) {
      this.dracoEncoder.SetSpeedOptions(...options.speed);
    }
    if (options.method) {
      const dracoMethod = this.draco[options.method];
      this.dracoEncoder.SetEncodingMethod(dracoMethod);
    }
    if (options.quantization) {
      for (const attribute in options.quantization) {
        const attributeType = attribute as DracoAttributeType;
        const bits = options.quantization[attributeType];
        if (bits !== undefined) {
          validateQuantizationBits(attributeType, bits, attributeType);
          this.dracoEncoder.SetAttributeQuantization(this.draco[attributeType], bits);
        }
      }
    }
  }

  /** Applies common options and per-attribute quantization to an expert encoder. */
  _setExpertOptions(
    expertEncoder: ExpertEncoder,
    attributes: Record<string, DracoBuilderAttributeInfo>,
    options: DracoBuildOptions
  ): void {
    if (options.speed) {
      expertEncoder.SetSpeedOptions(...options.speed);
    }
    if (options.method) {
      expertEncoder.SetEncodingMethod(this.draco[options.method]);
    }

    const quantization = this._getAttributeQuantization(attributes, options);
    for (const [attributeName, setting] of quantization) {
      const attribute = attributes[attributeName];
      if (typeof setting === 'number') {
        expertEncoder.SetAttributeQuantization(attribute.attributeId, setting);
      } else {
        expertEncoder.SetAttributeExplicitQuantization(
          attribute.attributeId,
          setting.bits,
          attribute.componentCount,
          setting.origin,
          setting.range
        );
      }
    }
  }

  /** Resolves category and exact quantization settings for every encoded attribute. */
  _getAttributeQuantization(
    attributes: Record<string, DracoBuilderAttributeInfo>,
    options: DracoBuildOptions
  ): Map<string, DracoAttributeQuantization> {
    const categoryQuantization = new Map<draco_GeometryAttribute_Type, number>();
    for (const attributeType of Object.keys(options.quantization || {}) as DracoAttributeType[]) {
      const bits = options.quantization?.[attributeType];
      if (bits !== undefined) {
        validateQuantizationBits(attributeType, bits, attributeType);
        categoryQuantization.set(this.draco[attributeType], bits);
      }
    }

    const quantization = new Map<string, DracoAttributeQuantization>();
    for (const [attributeName, attribute] of Object.entries(attributes)) {
      const bits = categoryQuantization.get(attribute.attributeType);
      if (bits !== undefined) {
        quantization.set(attributeName, bits);
      }
    }
    for (const [attributeName, setting] of Object.entries(options.attributeQuantization || {})) {
      const attribute = attributes[attributeName];
      if (!attribute) {
        throw new Error(`DracoWriter: quantized attribute "${attributeName}" does not exist`);
      }
      if (typeof setting === 'number') {
        validateQuantizationBits(attributeName, setting, attribute.attributeTypeName);
      } else {
        if (attribute.attributeTypeName === 'NORMAL') {
          throw new Error(
            `DracoWriter: explicit quantization transforms are not supported for NORMAL attribute "${attributeName}"`
          );
        }
        validateExplicitQuantization(
          attributeName,
          attributes[attributeName].componentCount,
          setting
        );
      }
      quantization.set(attributeName, setting);
    }
    for (const attributeName of quantization.keys()) {
      if (!attributes[attributeName].supportsQuantization) {
        throw new Error(
          `DracoWriter: quantization for "${attributeName}" requires floating-point attribute data`
        );
      }
    }
    return quantization;
  }

  /** Builds public diagnostics for a completed native encoding. */
  _getEncodingReport(
    geometryType: 'mesh' | 'point-cloud',
    byteLength: number,
    geometry: Mesh | PointCloud,
    encoder: Encoder | ExpertEncoder,
    attributes: Record<string, DracoBuilderAttributeInfo>,
    options: DracoBuildOptions,
    trackEncodedProperties: boolean
  ): DracoEncodingReport {
    const quantization = this._getAttributeQuantization(attributes, options);
    const attributeReports: Record<string, DracoEncodingAttributeReport> = {};
    for (const [attributeName, attribute] of Object.entries(attributes)) {
      attributeReports[attributeName] = {
        id: attribute.attributeId,
        type: attribute.attributeTypeName,
        componentCount: attribute.componentCount,
        ...(quantization.has(attributeName) ? {quantization: quantization.get(attributeName)} : {})
      };
    }
    return {
      geometryType,
      byteLength,
      pointCount: trackEncodedProperties
        ? encoder.GetNumberOfEncodedPoints()
        : geometry.num_points(),
      faceCount: trackEncodedProperties
        ? encoder.GetNumberOfEncodedFaces()
        : geometryType === 'mesh'
          ? typeof (geometry as Mesh).num_faces === 'function'
            ? (geometry as Mesh).num_faces()
            : 0
          : 0,
      attributeCount: geometry.num_attributes(),
      ...(options.method ? {method: options.method} : {}),
      ...(options.speed ? {speed: options.speed} : {}),
      attributes: attributeReports
    };
  }

  /**
   * @param {Mesh} dracoMesh
   * @param {object} attributes
   * @returns {Mesh}
   */
  _createDracoMesh(
    dracoMesh: Mesh,
    attributes: Record<string, TypedArray | MeshAttribute>,
    options: DracoBuildOptions
  ): Record<string, DracoBuilderAttributeInfo> {
    const optionalMetadata = options.attributesMetadata || {};
    const attributeInfo: Record<string, DracoBuilderAttributeInfo> = {};

    const vertexCount = this._getVertexCount(attributes, options);
    for (const [attributeName, attribute] of Object.entries(attributes)) {
      const uniqueId = this._addAttributeToMesh(
        dracoMesh,
        attributeName,
        attribute,
        vertexCount,
        options
      );

      if (uniqueId !== -1) {
        const attributeValue = getAttributeValue(attribute);
        const attributeType = this._getDracoAttributeType(
          attributeName,
          options.attributeTypes
        ) as draco_GeometryAttribute_Type;
        attributeInfo[attributeName] = {
          attributeId: uniqueId,
          attributeType,
          attributeTypeName: getDracoAttributeTypeName(this.draco, attributeType),
          componentCount: getAttributeSize(attribute, attributeValue!.length / vertexCount),
          supportsQuantization: attributeValue instanceof Float32Array
        };
        this._addAttributeMetadata(dracoMesh, uniqueId, {
          [options.attributeNameEntry || 'name']: attributeName,
          ...(optionalMetadata[attributeName] || {})
        });
      }
    }

    return attributeInfo;
  }

  /**
   * @param {} dracoPointCloud
   * @param {object} attributes
   */
  _createDracoPointCloud(
    dracoPointCloud: PointCloud,
    attributes: Record<string, TypedArray | MeshAttribute>,
    options: DracoBuildOptions
  ): Record<string, DracoBuilderAttributeInfo> {
    const optionalMetadata = options.attributesMetadata || {};
    const attributeInfo: Record<string, DracoBuilderAttributeInfo> = {};

    const vertexCount = this._getVertexCount(attributes, options);
    for (const [attributeName, attribute] of Object.entries(attributes)) {
      const uniqueId = this._addAttributeToMesh(
        dracoPointCloud,
        attributeName,
        attribute,
        vertexCount,
        options
      );
      if (uniqueId !== -1) {
        const attributeValue = getAttributeValue(attribute);
        const attributeType = this._getDracoAttributeType(
          attributeName,
          options.attributeTypes
        ) as draco_GeometryAttribute_Type;
        attributeInfo[attributeName] = {
          attributeId: uniqueId,
          attributeType,
          attributeTypeName: getDracoAttributeTypeName(this.draco, attributeType),
          componentCount: getAttributeSize(attribute, attributeValue!.length / vertexCount),
          supportsQuantization: attributeValue instanceof Float32Array
        };
        this._addAttributeMetadata(dracoPointCloud, uniqueId, {
          [options.attributeNameEntry || 'name']: attributeName,
          ...(optionalMetadata[attributeName] || {})
        });
      }
    }

    return attributeInfo;
  }

  /**
   * @param mesh
   * @param attributeName
   * @param attribute
   * @param vertexCount
   */
  _addAttributeToMesh(
    mesh: PointCloud,
    attributeName: string,
    attribute: TypedArray | MeshAttribute,
    vertexCount: number,
    options: DracoBuildOptions = {}
  ): number {
    const attributeValue = getAttributeValue(attribute);
    if (!attributeValue) {
      throw new Error(`DracoWriter: attribute "${attributeName}" must contain a typed array`);
    }

    const type = this._getDracoAttributeType(attributeName, options.attributeTypes);
    const size = getAttributeSize(attribute, attributeValue.length / vertexCount);

    if (type === 'indices') {
      if (attributeValue.length % 3 !== 0) {
        throw new Error('DracoWriter: triangle indices length must be divisible by 3');
      }
      validateIndices(attributeValue, vertexCount);
      const numFaces = attributeValue.length / 3;
      this.log(`Adding attribute ${attributeName}, size ${numFaces}`);

      const indices =
        attributeValue instanceof Uint16Array || attributeValue instanceof Uint32Array
          ? attributeValue
          : Uint32Array.from(attributeValue);
      this.dracoMeshBuilder.AddFacesToMesh(mesh as Mesh, numFaces, indices);
      return -1;
    }

    if (!Number.isInteger(size) || size <= 0 || attributeValue.length !== vertexCount * size) {
      throw new Error(
        `DracoWriter: attribute "${attributeName}" has ${attributeValue.length} values, expected ${vertexCount * size}`
      );
    }

    this.log(`Adding attribute ${attributeName}, size ${size}`);

    const builder = this.dracoMeshBuilder;
    let uniqueAttributeId = -1;
    if (attributeValue instanceof Int8Array) {
      uniqueAttributeId = builder.AddInt8Attribute(mesh, type, vertexCount, size, attributeValue);
    } else if (attributeValue instanceof Int16Array) {
      uniqueAttributeId = builder.AddInt16Attribute(mesh, type, vertexCount, size, attributeValue);
    } else if (attributeValue instanceof Int32Array) {
      uniqueAttributeId = builder.AddInt32Attribute(mesh, type, vertexCount, size, attributeValue);
    } else if (attributeValue instanceof Uint8Array) {
      uniqueAttributeId = builder.AddUInt8Attribute(mesh, type, vertexCount, size, attributeValue);
    } else if (attributeValue instanceof Uint8ClampedArray) {
      const uint8Value = new Uint8Array(
        attributeValue.buffer,
        attributeValue.byteOffset,
        attributeValue.byteLength
      );
      uniqueAttributeId = builder.AddUInt8Attribute(mesh, type, vertexCount, size, uint8Value);
    } else if (attributeValue instanceof Uint16Array) {
      uniqueAttributeId = builder.AddUInt16Attribute(mesh, type, vertexCount, size, attributeValue);
    } else if (attributeValue instanceof Uint32Array) {
      uniqueAttributeId = builder.AddUInt32Attribute(mesh, type, vertexCount, size, attributeValue);
    } else if (attributeValue instanceof Float32Array) {
      uniqueAttributeId = builder.AddFloatAttribute(mesh, type, vertexCount, size, attributeValue);
    } else {
      throw new Error(
        `DracoWriter: attribute "${attributeName}" uses unsupported ${attributeValue.constructor.name}`
      );
    }

    if (!ArrayBuffer.isView(attribute) && attribute.normalized !== undefined) {
      builder.SetNormalizedFlagForAttribute(mesh, uniqueAttributeId, attribute.normalized);
    }
    return uniqueAttributeId;

    // case Float64Array:
    // Add attribute does not seem to be exposed
    //   return builder.AddAttribute(mesh, type, vertexCount, size, new Float32Array(buffer));
  }

  /**
   * DRACO can compress attributes of know type better
   * @param attributeName
   */
  _getDracoAttributeType(
    attributeName: string,
    attributeTypes: Record<string, DracoAttributeType> = {}
  ): draco_GeometryAttribute_Type | 'indices' {
    if (attributeName.toLowerCase() === 'indices') {
      return 'indices';
    }
    const explicitType = attributeTypes[attributeName];
    if (explicitType) {
      return this.draco[explicitType];
    }
    const gltfAttributeName = GLTF_TO_DRACO_ATTRIBUTE_NAME_MAP[attributeName];
    if (gltfAttributeName) {
      return this.draco[gltfAttributeName];
    }
    switch (attributeName.toLowerCase()) {
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
      case 'texcoord':
      case 'texcoords':
        return this.draco.TEX_COORD;
      default:
        if (/^color_\d+$/i.test(attributeName)) {
          return this.draco.COLOR;
        }
        if (/^texcoord_\d+$/i.test(attributeName)) {
          return this.draco.TEX_COORD;
        }
        return this.draco.GENERIC;
    }
  }

  /** Returns the common vertex count after validating the required position attribute. */
  _getVertexCount(
    attributes: Record<string, TypedArray | MeshAttribute>,
    options: DracoBuildOptions
  ): number {
    const positions = this._getPositionAttribute(attributes, options.attributeTypes);
    const positionValues = positions && getAttributeValue(positions);
    if (!positions || !positionValues) {
      throw new Error('DracoWriter: POSITION attribute is required');
    }
    const size = getAttributeSize(positions, 3);
    if (!Number.isInteger(size) || size <= 0 || positionValues.length % size !== 0) {
      throw new Error('DracoWriter: POSITION attribute has an invalid size or value count');
    }
    return positionValues.length / size;
  }

  _getPositionAttribute(
    attributes: Record<string, TypedArray | MeshAttribute>,
    attributeTypes: Record<string, DracoAttributeType> = {}
  ): TypedArray | MeshAttribute | null {
    for (const attributeName in attributes) {
      const attribute = attributes[attributeName];
      const dracoType = this._getDracoAttributeType(attributeName, attributeTypes);
      if (dracoType === this.draco.POSITION && getAttributeValue(attribute)) {
        return attribute;
      }
    }
    return null;
  }

  /**
   * Add metadata for the geometry.
   * @param dracoGeometry - WASM Draco Object
   * @param metadata
   */
  _addGeometryMetadata(dracoGeometry: PointCloud, metadata: DracoMetadata): void {
    const dracoMetadata = new this.draco.Metadata();
    this._populateDracoMetadata(dracoMetadata, metadata);
    this.dracoMeshBuilder.AddMetadata(dracoGeometry, dracoMetadata);
  }

  /**
   * Add metadata for an attribute to geometry.
   * @param dracoGeometry - WASM Draco Object
   * @param uniqueAttributeId
   * @param metadata
   */
  _addAttributeMetadata(
    dracoGeometry: PointCloud,
    uniqueAttributeId: number,
    metadata: Map<string, string> | DracoMetadata
  ): void {
    // Note: Draco JS IDL doesn't seem to expose draco.AttributeMetadata, however it seems to
    // create such objects automatically from draco.Metadata object.
    const dracoAttributeMetadata = new this.draco.Metadata();
    this._populateDracoMetadata(dracoAttributeMetadata, metadata);
    // Draco3d doc note: Directly add attribute metadata to geometry.
    // You can do this without explicitly adding |GeometryMetadata| to mesh.
    this.dracoMeshBuilder.SetMetadataForAttribute(
      dracoGeometry,
      uniqueAttributeId,
      dracoAttributeMetadata
    );
  }

  /**
   * Add contents of object or map to a WASM Draco Metadata Object
   * @param dracoMetadata - WASM Draco Object
   * @param metadata
   */
  _populateDracoMetadata(
    dracoMetadata: Metadata,
    metadata: Map<string, string | number | Int32Array> | DracoMetadata
  ): void {
    for (const [key, value] of getEntries(metadata)) {
      switch (typeof value) {
        case 'number':
          if (Math.trunc(value) === value) {
            this.dracoMetadataBuilder.AddIntEntry(dracoMetadata, key, value);
          } else {
            this.dracoMetadataBuilder.AddDoubleEntry(dracoMetadata, key, value);
          }
          break;
        case 'object':
          if (value instanceof Int32Array) {
            this.dracoMetadataBuilder.AddIntEntryArray(dracoMetadata, key, value, value.length);
          }
          break;
        case 'string':
        default:
          this.dracoMetadataBuilder.AddStringEntry(dracoMetadata, key, value);
      }
    }
  }
}

// HELPER FUNCTIONS

/**
 * Copy encoded data to buffer
 * @param dracoData
 */
function dracoInt8ArrayToArrayBuffer(dracoData: DracoInt8Array): ArrayBuffer {
  const byteLength = dracoData.size();
  const outputBuffer = new ArrayBuffer(byteLength);
  const outputData = new Int8Array(outputBuffer);
  for (let i = 0; i < byteLength; ++i) {
    outputData[i] = dracoData.GetValue(i);
  }
  return outputBuffer;
}

/** Enable iteration over either an object or a map */
function getEntries(
  container: Map<string, string | number | Int32Array> | DracoMetadata
): Iterable<[string, string | number | Int32Array]> {
  return container instanceof Map ? container.entries() : Object.entries(container);
}

/** Returns the typed-array payload from either accepted attribute representation. */
function getAttributeValue(attribute: TypedArray | MeshAttribute): TypedArray | null {
  if (ArrayBuffer.isView(attribute)) {
    return attribute;
  }
  if (
    attribute &&
    typeof attribute === 'object' &&
    'value' in attribute &&
    ArrayBuffer.isView(attribute.value)
  ) {
    return attribute.value;
  }
  return null;
}

/** Returns the declared component count, falling back to the inferred legacy value. */
function getAttributeSize(attribute: TypedArray | MeshAttribute, inferredSize: number): number {
  return ArrayBuffer.isView(attribute) ? inferredSize : attribute.size;
}

/** Validates that triangle indices are integers within the encoded vertex range. */
function validateIndices(indices: TypedArray, vertexCount: number): void {
  for (const index of indices) {
    if (!Number.isInteger(index) || index < 0 || index >= vertexCount) {
      throw new Error(
        `DracoWriter: triangle index ${index} is outside vertex range 0-${vertexCount - 1}`
      );
    }
  }
}

/** Returns true when exact application attributes require the expert encoder. */
function hasAttributeQuantization(options: DracoBuildOptions): boolean {
  return Boolean(
    options.attributeQuantization && Object.keys(options.attributeQuantization).length
  );
}

/** Validates a Draco quantization bit count. */
function validateQuantizationBits(
  attributeName: string,
  bits: number,
  attributeType?: DracoAttributeType
): void {
  if (!Number.isInteger(bits) || bits < 1 || bits > 30) {
    throw new Error(
      `DracoWriter: quantization bits for "${attributeName}" must be an integer from 1 to 30`
    );
  }
  if (attributeType === 'NORMAL' && (bits < 2 || bits > 29)) {
    throw new Error(
      `DracoWriter: quantization bits for NORMAL attribute "${attributeName}" must be an integer from 2 to 29`
    );
  }
}

/** Validates an explicit per-attribute quantization transform. */
function validateExplicitQuantization(
  attributeName: string,
  componentCount: number,
  quantization: DracoExplicitQuantization
): void {
  validateQuantizationBits(attributeName, quantization.bits);
  if (!Array.isArray(quantization.origin) || quantization.origin.length !== componentCount) {
    throw new Error(
      `DracoWriter: quantization origin for "${attributeName}" must contain ${componentCount} values`
    );
  }
  if (!quantization.origin.every(Number.isFinite)) {
    throw new Error(`DracoWriter: quantization origin for "${attributeName}" must be finite`);
  }
  if (!Number.isFinite(quantization.range) || quantization.range <= 0) {
    throw new Error(`DracoWriter: quantization range for "${attributeName}" must be positive`);
  }
}

/** Returns the public Draco category name for a native enum value. */
function getDracoAttributeTypeName(
  draco: Draco3D,
  attributeType: draco_GeometryAttribute_Type
): DracoAttributeType {
  for (const name of ['POSITION', 'NORMAL', 'COLOR', 'TEX_COORD', 'GENERIC'] as const) {
    if (draco[name] === attributeType) {
      return name;
    }
  }
  return 'GENERIC';
}

/** Resolves named presets without mutating the caller's options object. */
function applyDracoEncodingPreset(options: DracoBuildOptions): DracoBuildOptions {
  const presetOptions: Record<DracoEncodingPreset, DracoBuildOptions> = {
    gltf: {
      method: 'MESH_EDGEBREAKER_ENCODING',
      speed: [5, 5],
      quantization: {POSITION: 14, NORMAL: 10, TEX_COORD: 12}
    },
    webgpu: {
      method: 'MESH_SEQUENTIAL_ENCODING',
      speed: [5, 5],
      quantization: {POSITION: 14, NORMAL: 10, TEX_COORD: 12}
    },
    balanced: {
      method: 'MESH_EDGEBREAKER_ENCODING',
      speed: [5, 5],
      quantization: {POSITION: 12, NORMAL: 10, TEX_COORD: 10}
    }
  };
  const preset = options.preset ? presetOptions[options.preset] : {};
  return {
    ...preset,
    ...options,
    quantization: {...preset.quantization, ...options.quantization}
  };
}
