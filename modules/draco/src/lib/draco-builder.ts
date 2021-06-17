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

import type {TypedArray, DracoMeshData} from '../types';

export type DracoBuildOptions = {
  pointcloud?: boolean;
  metadata?: {[key: string]: string};
  attributesMetadata?: {};
  log?: any;

  // draco encoding options
  speed?: [number, number];
  method?: string;
  quantization?: {[attributeName: string]: number};
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
  log: any;

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
    // @ts-ignore
    this.dracoMeshBuilder = null;
    // @ts-ignore
    this.dracoEncoder = null;
    // @ts-ignore
    this.draco = null;
  }

  // TBD - when does this need to be called?
  destroyEncodedObject(object): void {
    if (object) {
      this.draco.destroy(object);
    }
  }

  /**
   * Encode mesh or point cloud
   * @param mesh =({})
   * @param options
   */
  encodeSync(mesh: DracoMeshData, options: DracoBuildOptions = {}): ArrayBuffer {
    this.log = noop; // TODO
    this._setOptions(options);

    return options.pointcloud
      ? this._encodePointCloud(mesh, options)
      : this._encodeMesh(mesh, options);
  }

  // PRIVATE

  _getAttributesFromMesh(mesh: DracoMeshData) {
    // TODO - Change the encodePointCloud interface instead?
    const attributes = {...mesh, ...mesh.attributes};
    // Fold indices into the attributes
    if (mesh.indices) {
      attributes.indices = mesh.indices;
    }
    return attributes;
  }

  _encodePointCloud(pointcloud: DracoMeshData, options: DracoBuildOptions): ArrayBuffer {
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

  _encodeMesh(mesh: DracoMeshData, options: DracoBuildOptions): ArrayBuffer {
    const dracoMesh = new this.draco.Mesh();

    if (options.metadata) {
      this._addGeometryMetadata(dracoMesh, options.metadata);
    }

    const attributes = this._getAttributesFromMesh(mesh);

    // Build a `DracoMeshData` from the input data
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

  /**
   * Set encoding options.
   * @param {{speed?: any; method?: any; quantization?: any;}} options
   */
  _setOptions(options: DracoBuildOptions): void {
    if ('speed' in options) {
      // @ts-ignore
      this.dracoEncoder.SetSpeedOptions(...options.speed);
    }
    if ('method' in options) {
      const dracoMethod = this.draco[options.method || 'MESH_SEQUENTIAL_ENCODING'];
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
   * @param {Mesh} dracoMesh
   * @param {object} attributes
   * @returns {Mesh}
   */
  _createDracoMesh(dracoMesh: Mesh, attributes, options: DracoBuildOptions): Mesh {
    const optionalMetadata = options.attributesMetadata || {};

    try {
      const positions = this._getPositionAttribute(attributes);
      if (!positions) {
        throw new Error('positions');
      }
      const vertexCount = positions.length / 3;

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
    attributes: object,
    options: DracoBuildOptions
  ): PointCloud {
    const optionalMetadata = options.attributesMetadata || {};

    try {
      const positions = this._getPositionAttribute(attributes);
      if (!positions) {
        throw new Error('positions');
      }
      const vertexCount = positions.length / 3;

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
    attribute: TypedArray,
    vertexCount: number
  ) {
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

  /**
   * Add metadata for the geometry.
   * @param dracoGeometry - WASM Draco Object
   * @param metadata
   */
  _addGeometryMetadata(dracoGeometry: PointCloud, metadata: {[key: string]: string}) {
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
    metadata: Map<string, string> | {[key: string]: string}
  ) {
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
    metadata: Map<string, string> | {[key: string]: string}
  ) {
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
function dracoInt8ArrayToArrayBuffer(dracoData: DracoInt8Array) {
  const byteLength = dracoData.size();
  const outputBuffer = new ArrayBuffer(byteLength);
  const outputData = new Int8Array(outputBuffer);
  for (let i = 0; i < byteLength; ++i) {
    outputData[i] = dracoData.GetValue(i);
  }
  return outputBuffer;
}

/** Enable iteration over either an object or a map */
function getEntries(container) {
  const hasEntriesFunc = container.entries && !container.hasOwnProperty('entries');
  return hasEntriesFunc ? container.entries() : Object.entries(container);
}
