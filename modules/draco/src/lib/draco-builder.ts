// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */
// This code is inspired by example code in the DRACO repository
import type {
  Draco3D,
  DracoInt8Array,
  Encoder,
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

export type DracoBuildOptions = {
  pointcloud?: boolean;
  metadata?: DracoMetadata;
  attributesMetadata?: Record<string, DracoMetadata>;
  log?: (message: string) => void;

  // draco encoding options
  speed?: [number, number];
  method?: DracoEncodingMethod;
  quantization?: Record<string, number>;
};

// Native Draco attribute names to GLTF attribute names.
const GLTF_TO_DRACO_ATTRIBUTE_NAME_MAP = {
  POSITION: 'POSITION',
  NORMAL: 'NORMAL',
  COLOR_0: 'COLOR',
  TEXCOORD_0: 'TEX_COORD'
};

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
    this.log = options.log || noop;
    this._setOptions(options);

    return options.pointcloud
      ? this._encodePointCloud(mesh, options)
      : this._encodeMesh(mesh, options);
  }

  // PRIVATE

  _getAttributesFromMesh(mesh: DracoBuilderMesh): Record<string, TypedArray | MeshAttribute> {
    return {
      ...(mesh.indices ? {indices: mesh.indices} : {}),
      ...mesh.attributes
    };
  }

  _encodePointCloud(pointcloud: DracoBuilderMesh, options: DracoBuildOptions): ArrayBuffer {
    const dracoPointCloud = new this.draco.PointCloud();

    if (options.metadata) {
      this._addGeometryMetadata(dracoPointCloud, options.metadata);
    }

    const attributes = this._getAttributesFromMesh(pointcloud);

    // Build a `DracoPointCloud` from the input data
    this._createDracoPointCloud(dracoPointCloud, attributes, options);

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

  _encodeMesh(mesh: DracoBuilderMesh, options: DracoBuildOptions): ArrayBuffer {
    const dracoMesh = new this.draco.Mesh();

    if (options.metadata) {
      this._addGeometryMetadata(dracoMesh, options.metadata);
    }

    const attributes = this._getAttributesFromMesh(mesh);

    // Build a `DracoMesh` from the input data
    this._createDracoMesh(dracoMesh, attributes, options);

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
        const bits = options.quantization[attribute];
        const dracoPosition = this.draco[attribute];
        this.dracoEncoder.SetAttributeQuantization(dracoPosition, bits);
      }
    }
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
  ): Mesh {
    const optionalMetadata = options.attributesMetadata || {};

    try {
      const positions = this._getPositionAttribute(attributes);
      if (!positions) {
        throw new Error('positions');
      }
      const positionValues = getAttributeValue(positions);
      if (!positionValues) {
        throw new Error('positions');
      }
      const vertexCount = positionValues.length / getAttributeSize(positions, 3);

      for (let attributeName in attributes) {
        const attribute = attributes[attributeName];
        attributeName = GLTF_TO_DRACO_ATTRIBUTE_NAME_MAP[attributeName] || attributeName;
        const uniqueId = this._addAttributeToMesh(dracoMesh, attributeName, attribute, vertexCount);

        if (uniqueId !== -1) {
          this._addAttributeMetadata(dracoMesh, uniqueId, {
            name: attributeName,
            ...(optionalMetadata[attributeName] || {})
          });
        }
      }
    } catch (error) {
      this.destroyEncodedObject(dracoMesh);
      throw error;
    }

    return dracoMesh;
  }

  /**
   * @param {} dracoPointCloud
   * @param {object} attributes
   */
  _createDracoPointCloud(
    dracoPointCloud: PointCloud,
    attributes: Record<string, TypedArray | MeshAttribute>,
    options: DracoBuildOptions
  ): PointCloud {
    const optionalMetadata = options.attributesMetadata || {};

    try {
      const positions = this._getPositionAttribute(attributes);
      if (!positions) {
        throw new Error('positions');
      }
      const positionValues = getAttributeValue(positions);
      if (!positionValues) {
        throw new Error('positions');
      }
      const vertexCount = positionValues.length / getAttributeSize(positions, 3);

      for (let attributeName in attributes) {
        const attribute = attributes[attributeName];
        attributeName = GLTF_TO_DRACO_ATTRIBUTE_NAME_MAP[attributeName] || attributeName;
        const uniqueId = this._addAttributeToMesh(
          dracoPointCloud,
          attributeName,
          attribute,
          vertexCount
        );
        if (uniqueId !== -1) {
          this._addAttributeMetadata(dracoPointCloud, uniqueId, {
            name: attributeName,
            ...(optionalMetadata[attributeName] || {})
          });
        }
      }
    } catch (error) {
      this.destroyEncodedObject(dracoPointCloud);
      throw error;
    }

    return dracoPointCloud;
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
    vertexCount: number
  ): number {
    const attributeValue = getAttributeValue(attribute);
    if (!attributeValue) {
      return -1;
    }

    const type = this._getDracoAttributeType(attributeName);
    const size = getAttributeSize(attribute, attributeValue.length / vertexCount);

    if (type === 'indices') {
      const numFaces = attributeValue.length / 3;
      this.log(`Adding attribute ${attributeName}, size ${numFaces}`);

      const indices =
        attributeValue instanceof Uint16Array || attributeValue instanceof Uint32Array
          ? attributeValue
          : Uint32Array.from(attributeValue);
      this.dracoMeshBuilder.AddFacesToMesh(mesh as Mesh, numFaces, indices);
      return -1;
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
      // eslint-disable-next-line no-console
      console.warn('Unsupported attribute type', attribute);
      return -1;
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
   * TODO - expose an attribute type map?
   * @param attributeName
   */
  _getDracoAttributeType(attributeName: string): draco_GeometryAttribute_Type | 'indices' {
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
      case 'texcoord':
      case 'texcoords':
        return this.draco.TEX_COORD;
      default:
        return this.draco.GENERIC;
    }
  }

  _getPositionAttribute(
    attributes: Record<string, TypedArray | MeshAttribute>
  ): TypedArray | MeshAttribute | null {
    for (const attributeName in attributes) {
      const attribute = attributes[attributeName];
      const dracoType = this._getDracoAttributeType(attributeName);
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
