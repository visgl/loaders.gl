// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Ellipsoid} from '@math.gl/geospatial';
import {GZipCompressor} from '@loaders.gl/compression/gzip-compressor';
import type {MeshGeometry} from '@loaders.gl/schema';
import {encodeI3SMeshAttributes} from './i3s-mesh-attributes';
import type {I3SMeshFeatures} from './i3s-mesh-attributes';
export type {I3SMeshFeatures} from './i3s-mesh-attributes';

/** Untextured metallic/roughness factors supported by the I3S mesh profile. */
export interface I3SMeshMaterial {
  /** Linear RGBA multiplier in [0, 1]; RGB is encoded as I3S sRGB, alpha is unchanged. */
  readonly baseColorFactor?: readonly [number, number, number, number];
  /** Metallic weight; glTF and I3S default to one. */
  readonly metallicFactor?: number;
  /** Roughness weight; glTF and I3S default to one. */
  readonly roughnessFactor?: number;
  /** Alpha interpretation, converted to the I3S lowercase spelling. */
  readonly alphaMode?: 'OPAQUE' | 'MASK' | 'BLEND';
  /** Explicit threshold for MASK; omitted glTF values use 0.5. */
  readonly alphaCutoff?: number;
  /** Whether both sides are rendered. */
  readonly doubleSided?: boolean;
}

/** Required limits and optional feature/appearance inputs for the single-mesh I3S 1.7 profile. */
export interface I3SMeshWriterOptions {
  /** Finite nonnegative reconstruction error in meters after geographic float32 encoding. */
  readonly maxPositionError: number;
  /** Maximum bytes for each uncompressed geometry, attribute, or JSON resource. */
  readonly maxResourceBytes: number;
  /** Optional layer name. */
  readonly name?: string;
  /** Optional untextured material. */
  readonly material?: I3SMeshMaterial;
  /** Explicit Arrow feature table and triangle association. */
  readonly features?: I3SMeshFeatures;
}

/** Generated I3S resources ready for portable SLPK packaging. */
export interface EncodedI3SMeshLayer {
  /** Individually GZIP-compressed resources with archive-relative names. */
  readonly files: Readonly<Record<string, ArrayBuffer>>;
  /** Largest measured ECEF reconstruction error in meters. */
  readonly maximumPositionError: number;
  /** Feature columns represented as decimal strings by explicit request. */
  readonly decimalStringFields: readonly string[];
}

/**
 * Authors an I3S 1.7 3D Object layer from one untextured triangle mesh in absolute EPSG:4978.
 * Positions accept packed Float32/Float64 xyz and normals packed unit Float32 ECEF vectors.
 * Indices are expanded and triangles are stably grouped by feature row without changing winding.
 * WGS84 longitude/latitude/ellipsoidal height offsets are measured against an explicit meter
 * error budget. An empty root and one leaf are emitted in both legacy and paged indices.
 * The profile rejects textures, colors, unknown attributes, unused feature rows, invalid
 * associations, and unsupported property types instead of discarding them. Resource caps bound
 * individual buffers, not peak memory. Independent viewer qualification remains application-owned.
 * @param mesh - Absolute ECEF triangle geometry; input arrays are never modified.
 * @param options - Required resource and precision limits and explicit metadata mappings.
 * @returns Finalized compressed resources accepted by SLPKWriter.
 */
export function encodeI3SMeshLayer(
  mesh: MeshGeometry,
  options: I3SMeshWriterOptions
): EncodedI3SMeshLayer {
  if (
    !Number.isFinite(options.maxPositionError) ||
    options.maxPositionError < 0 ||
    !Number.isSafeInteger(options.maxResourceBytes) ||
    options.maxResourceBytes < 1 ||
    options.maxResourceBytes > 0xfffffffe
  ) {
    throw new Error('I3S mesh writing requires valid maxPositionError and maxResourceBytes');
  }
  const positions = mesh.attributes.POSITION;
  if (
    mesh.topology !== 'triangle-list' ||
    mesh.mode !== 4 ||
    !positions ||
    positions.size !== 3 ||
    !(positions.value instanceof Float32Array || positions.value instanceof Float64Array) ||
    positions.value.length === 0 ||
    positions.value.length % 3 ||
    positions.value.some(value => !Number.isFinite(value))
  ) {
    throw new Error('I3S mesh writing requires finite packed triangle positions');
  }
  for (const [name, attribute] of Object.entries(mesh.attributes)) {
    if (
      !['POSITION', 'NORMAL'].includes(name) ||
      attribute.byteOffset ||
      attribute.byteStride ||
      attribute.normalized ||
      attribute.transform ||
      attribute.componentType
    ) {
      throw new Error(`Unsupported I3S mesh attribute/layout: ${name}`);
    }
  }
  const normals = mesh.attributes.NORMAL;
  if (
    normals &&
    (normals.size !== 3 ||
      !(normals.value instanceof Float32Array) ||
      normals.value.length !== positions.value.length)
  ) {
    throw new Error('I3S normals require one packed Float32 xyz vector per vertex');
  }
  if (normals) {
    for (let index = 0; index < normals.value.length; index += 3) {
      if (
        Math.abs(
          Math.hypot(normals.value[index], normals.value[index + 1], normals.value[index + 2]) - 1
        ) > 0.0001 ||
        !Array.from(normals.value.subarray(index, index + 3)).every(Number.isFinite)
      ) {
        throw new Error('I3S normals must be finite unit vectors');
      }
    }
  }
  const vertexCount = positions.value.length / 3;
  const indices = mesh.indices?.value;
  if (
    mesh.indices &&
    (mesh.indices.size !== 1 ||
      mesh.indices.byteOffset ||
      mesh.indices.byteStride ||
      mesh.indices.normalized ||
      mesh.indices.transform ||
      mesh.indices.componentType ||
      !(
        indices instanceof Uint8Array ||
        indices instanceof Uint16Array ||
        indices instanceof Uint32Array
      ))
  ) {
    throw new Error('I3S mesh indices require packed unsigned integer scalars');
  }
  const outputVertexCount = indices?.length ?? vertexCount;
  if (
    !outputVertexCount ||
    outputVertexCount % 3 ||
    (indices && indices.some(value => value >= vertexCount))
  ) {
    throw new Error('I3S indices must reference complete existing triangles');
  }
  const attributes = encodeI3SMeshAttributes(options.features, options.maxResourceBytes);
  const featureCount = options.features ? attributes.count : 1;
  const triangleCount = outputVertexCount / 3;
  const associations = options.features?.triangleFeatureIndices;
  if (
    options.features &&
    (!(associations instanceof Uint32Array) ||
      associations.length !== triangleCount ||
      associations.some(value => value >= featureCount))
  ) {
    throw new Error('I3S features require one valid row index per triangle');
  }
  const triangles = Array.from({length: featureCount}, () => [] as number[]);
  for (let triangle = 0; triangle < triangleCount; triangle++)
    triangles[associations?.[triangle] ?? 0].push(triangle);
  if (triangles.some(group => !group.length))
    throw new Error('I3S feature rows must each own at least one complete triangle');
  const byteLength = 8 + outputVertexCount * (normals ? 24 : 12) + featureCount * 16;
  if (byteLength > options.maxResourceBytes)
    throw new Error('I3S geometry exceeds maxResourceBytes');
  const minimum = [Infinity, Infinity, Infinity];
  const maximum = [-Infinity, -Infinity, -Infinity];
  for (let index = 0; index < outputVertexCount; index++) {
    const sourceIndex = indices?.[index] ?? index;
    for (let axis = 0; axis < 3; axis++) {
      minimum[axis] = Math.min(minimum[axis], positions.value[sourceIndex * 3 + axis]);
      maximum[axis] = Math.max(maximum[axis], positions.value[sourceIndex * 3 + axis]);
    }
  }
  const center = minimum.map((value, axis) => value / 2 + maximum[axis] / 2);
  if (Math.hypot(...center) < 1) throw new Error('I3S geographic mesh center is undefined');
  const geographicCenter = Array.from(Ellipsoid.WGS84.cartesianToCartographic(center));
  if (!geographicCenter.every(Number.isFinite))
    throw new Error('I3S geographic mesh center is undefined');
  const geometry = new ArrayBuffer(byteLength);
  const view = new DataView(geometry);
  view.setUint32(0, outputVertexCount, true);
  view.setUint32(4, featureCount, true);
  const halfSize = [0, 0, 0];
  const extent = [Infinity, Infinity, -Infinity, -Infinity];
  let maximumPositionError = 0;
  let outputIndex = 0;
  const faceRanges: number[] = [];
  for (const group of triangles) {
    faceRanges.push(outputIndex / 3, outputIndex / 3 + group.length - 1);
    for (const triangle of group) {
      for (let corner = 0; corner < 3; corner++) {
        const sourceIndex = indices?.[triangle * 3 + corner] ?? triangle * 3 + corner;
        const absolutePosition = positions.value.subarray(sourceIndex * 3, sourceIndex * 3 + 3);
        const geographicPosition = Ellipsoid.WGS84.cartesianToCartographic(absolutePosition);
        if (
          !Array.from(geographicPosition).every(Number.isFinite) ||
          Math.abs(geographicPosition[0] - geographicCenter[0]) > 180
        ) {
          throw new Error(
            'I3S initial mesh profile excludes undefined geographic positions and antimeridian wrapping'
          );
        }
        const reconstructedGeographic = geographicCenter.map(
          (value, axis) => value + Math.fround(geographicPosition[axis] - value)
        );
        const reconstructed = Ellipsoid.WGS84.cartographicToCartesian(reconstructedGeographic);
        const error = Math.hypot(
          ...Array.from(reconstructed, (value, axis) => value - absolutePosition[axis])
        );
        if (!Number.isFinite(error) || error > options.maxPositionError)
          throw new Error('I3S mesh exceeds maxPositionError');
        maximumPositionError = Math.max(maximumPositionError, error);
        for (let axis = 0; axis < 3; axis++) {
          view.setFloat32(
            8 + outputIndex * 12 + axis * 4,
            geographicPosition[axis] - geographicCenter[axis],
            true
          );
          halfSize[axis] = Math.max(halfSize[axis], Math.abs(reconstructed[axis] - center[axis]));
          if (normals)
            view.setFloat32(
              8 + outputVertexCount * 12 + outputIndex * 12 + axis * 4,
              normals.value[sourceIndex * 3 + axis],
              true
            );
        }
        extent[0] = Math.min(extent[0], reconstructedGeographic[0]);
        extent[1] = Math.min(extent[1], reconstructedGeographic[1]);
        extent[2] = Math.max(extent[2], reconstructedGeographic[0]);
        extent[3] = Math.max(extent[3], reconstructedGeographic[1]);
        outputIndex++;
      }
    }
  }
  const featureOffset = 8 + outputVertexCount * (normals ? 24 : 12);
  for (let index = 0; index < featureCount; index++) {
    view.setBigUint64(featureOffset + index * 8, BigInt(index), true);
    view.setUint32(featureOffset + featureCount * 8 + index * 8, faceRanges[index * 2], true);
    view.setUint32(
      featureOffset + featureCount * 8 + index * 8 + 4,
      faceRanges[index * 2 + 1],
      true
    );
  }
  // Include geographic center round-trip error in the conservative ECEF bound.
  const reconstructedCenter = Ellipsoid.WGS84.cartographicToCartesian(geographicCenter);
  const obb = {
    center: geographicCenter,
    halfSize: halfSize.map(
      (value, axis) => value + Math.abs(reconstructedCenter[axis] - center[axis]) + 1e-7
    ),
    quaternion: [0, 0, 0, 1]
  };
  const mbs = [...geographicCenter, Math.hypot(...obb.halfSize)];
  const geometryBuffer = {
    offset: 8,
    position: {type: 'Float32', component: 3},
    ...(normals ? {normal: {type: 'Float32', component: 3}} : {}),
    featureId: {type: 'UInt64', component: 1, binding: 'per-feature'},
    faceRange: {type: 'UInt32', component: 2, binding: 'per-feature'}
  };
  const defaultGeometrySchema = {
    geometryType: 'triangles',
    topology: 'PerAttributeArray',
    header: [
      {property: 'vertexCount', type: 'UInt32'},
      {property: 'featureCount', type: 'UInt32'}
    ],
    ordering: normals ? ['position', 'normal'] : ['position'],
    vertexAttributes: {
      position: {valueType: 'Float32', valuesPerElement: 3},
      ...(normals ? {normal: {valueType: 'Float32', valuesPerElement: 3}} : {})
    },
    featureAttributeOrder: ['id', 'faceRange'],
    featureAttributes: {
      id: {valueType: 'UInt64', valuesPerElement: 1},
      faceRange: {valueType: 'UInt32', valuesPerElement: 2}
    }
  };
  const material = encodeMaterial(options.material);
  const layer = {
    id: 0,
    version: '1',
    name: options.name || 'Converted mesh',
    description: options.features?.batches[0]?.schema?.metadata?.['loaders.gl:feature-class']
      ? `Source feature metadata class: ${options.features.batches[0].schema!.metadata!['loaders.gl:feature-class']}`
      : undefined,
    layerType: '3DObject',
    spatialReference: {wkid: 4326},
    heightModelInfo: {heightModel: 'ellipsoidal', heightUnit: 'meter'},
    capabilities: ['View'],
    fields: attributes.fields,
    attributeStorageInfo: attributes.storage,
    store: {
      id: '0',
      profile: 'meshpyramids',
      version: '1.7',
      rootNode: './nodes/root',
      resourcePattern: ['3dNodeIndexDocument', 'Geometry', 'Attributes'],
      extent,
      indexCRS: 'http://www.opengis.net/def/crs/EPSG/0/4326',
      vertexCRS: 'http://www.opengis.net/def/crs/EPSG/0/4326',
      normalReferenceFrame: 'earth-centered',
      defaultGeometrySchema
    },
    nodePages: {rootIndex: 0, nodesPerPage: 64, lodSelectionMetricType: 'maxScreenThresholdSQ'},
    geometryDefinitions: [{topology: 'triangle', geometryBuffers: [geometryBuffer]}],
    materialDefinitions: [material]
  };
  const leaf = {
    id: '1',
    level: 1,
    version: '1',
    mbs,
    obb,
    lodSelection: [{metricType: 'maxScreenThresholdSQ', maxError: 0}],
    children: [],
    parentNode: {id: 'root', href: '../root', mbs, obb},
    geometryData: [{href: './geometries/0'}],
    attributeData: attributes.buffers.map((_, index) => ({href: `./attributes/f_${index}/0`}))
  };
  const root = {
    id: 'root',
    level: 0,
    version: '1',
    mbs,
    obb,
    lodSelection: [{metricType: 'maxScreenThresholdSQ', maxError: 0}],
    children: [{id: '1', href: '../1', mbs, obb}]
  };
  const page = {
    nodes: [
      {index: 0, obb, lodThreshold: 0, children: [1]},
      {
        index: 1,
        parentIndex: 0,
        obb,
        lodThreshold: 0,
        children: [],
        mesh: {
          material: {definition: 0},
          geometry: {definition: 0, resource: 1, vertexCount: outputVertexCount, featureCount},
          attribute: {resource: 1}
        }
      }
    ]
  };
  const rawFiles: Record<string, ArrayBuffer> = {'nodes/1/geometries/0.bin.gz': geometry};
  for (const [name, json] of Object.entries({
    '3dSceneLayer.json.gz': layer,
    'nodes/root/3dNodeIndexDocument.json.gz': root,
    'nodes/1/3dNodeIndexDocument.json.gz': leaf,
    'nodepages/0.json.gz': page,
    'metadata.json.gz': {
      folderPattern: 'BASIC',
      archiveCompressionType: 'STORE',
      resourceCompressionType: 'GZIP',
      I3SVersion: '1.7',
      nodeCount: 2
    }
  })) {
    rawFiles[name] = new TextEncoder().encode(JSON.stringify(json)).buffer;
  }
  const objectIds = options.features ? attributes.buffers[0] : encodeDefaultObjectId();
  rawFiles['nodes/1/attributes/f_0/0.bin.gz'] = objectIds;
  for (let index = 1; index < attributes.buffers.length; index++)
    rawFiles[`nodes/1/attributes/f_${index}/0.bin.gz`] = attributes.buffers[index];
  const compressor = new GZipCompressor({useNative: false, gzip: {mtime: 0}});
  const files: Record<string, ArrayBuffer> = {};
  for (const [name, bytes] of Object.entries(rawFiles)) {
    if (bytes.byteLength > options.maxResourceBytes)
      throw new Error('I3S JSON/attribute exceeds maxResourceBytes');
    files[name] = compressor.compressSync(bytes);
  }
  return {files, maximumPositionError, decimalStringFields: attributes.decimalStringFields};
}

/** Encodes the synthetic feature ID for an unannotated mesh. */
function encodeDefaultObjectId(): ArrayBuffer {
  const buffer = new ArrayBuffer(8);
  new DataView(buffer).setUint32(0, 1, true);
  return buffer;
}

/** Maps the untextured glTF appearance without dropping unknown material semantics. */
function encodeMaterial(material: I3SMeshMaterial = {}): object {
  if (
    Object.keys(material).some(
      name =>
        ![
          'baseColorFactor',
          'metallicFactor',
          'roughnessFactor',
          'alphaMode',
          'alphaCutoff',
          'doubleSided'
        ].includes(name)
    )
  )
    throw new Error('Unsupported I3S material property');
  const {baseColorFactor, metallicFactor, roughnessFactor, alphaMode, alphaCutoff, doubleSided} =
    material;
  if (
    (baseColorFactor !== undefined &&
      (baseColorFactor.length !== 4 ||
        baseColorFactor.some(value => !Number.isFinite(value) || value < 0 || value > 1))) ||
    [metallicFactor, roughnessFactor].some(
      value => value !== undefined && (!Number.isFinite(value) || value < 0 || value > 1)
    ) ||
    (alphaMode !== undefined && !['OPAQUE', 'MASK', 'BLEND'].includes(alphaMode)) ||
    (alphaCutoff !== undefined &&
      (alphaMode !== 'MASK' || !Number.isFinite(alphaCutoff) || alphaCutoff < 0)) ||
    (doubleSided !== undefined && typeof doubleSided !== 'boolean')
  )
    throw new Error('Invalid I3S material factors');
  return {
    pbrMetallicRoughness: {
      baseColorFactor: baseColorFactor
        ? baseColorFactor.map((value, index) =>
            index < 3 ? convertLinearColorToSrgb(value) : value
          )
        : [1, 1, 1, 1],
      metallicFactor: metallicFactor ?? 1,
      roughnessFactor: roughnessFactor ?? 1
    },
    alphaMode: (alphaMode || 'OPAQUE').toLowerCase(),
    ...(alphaMode === 'MASK' ? {alphaCutoff: alphaCutoff ?? 0.5} : {}),
    doubleSided: doubleSided ?? false
  };
}

/** Encodes a validated linear RGB component using the standard sRGB transfer curve. */
function convertLinearColorToSrgb(value: number): number {
  if (value === 1) return 1;
  return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
}
