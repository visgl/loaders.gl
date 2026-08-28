// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DracoBuildOptions, DracoBuilderMesh, DracoEncodingResult} from '@loaders.gl/draco';
import {encodeDraco} from '@loaders.gl/draco';
import type {TypedArray} from '@loaders.gl/schema';
import type {GLTFWriterOptions} from '../../gltf-writer';
import type {GLTFMeshPrimitive} from '../types/gltf-json-schema';
import type {GLTFWithBuffers} from '../types/gltf-types';
import {getTypedArrayForAccessor} from '../gltf-utils/get-typed-array';

const KHR_DRACO_MESH_COMPRESSION = 'KHR_draco_mesh_compression';

/** Draco options accepted by the glTF writer. */
export type GLTFDracoWriterOptions = DracoBuildOptions & {
  /** Enable generation of `KHR_draco_mesh_compression` buffer views. */
  enabled?: boolean;
  /** Leave unsupported primitive modes unchanged instead of throwing. */
  skipUnsupportedPrimitives?: boolean;
};

/**
 * Creates a Draco-compressed glTF copy.
 *
 * The input JSON and loaded buffers are never modified. Compressed payloads
 * are appended to buffer 0 and referenced by `KHR_draco_mesh_compression`;
 * the original accessors remain available for consumers that do not decode the
 * extension.
 */
export async function compressGLTFWithDraco(
  gltf: GLTFWithBuffers,
  options: GLTFWriterOptions = {}
): Promise<GLTFWithBuffers> {
  const dracoOptions = options.gltf?.draco;
  if (!dracoOptions?.enabled) {
    return gltf;
  }
  if ((gltf.buffers?.length || 0) > 1) {
    throw new Error('GLTF Draco writer requires a single buffer');
  }

  const json = cloneGLTFJson(gltf.json);
  const buffers = cloneBuffers(gltf.buffers || []);
  const output: GLTFWithBuffers = {...gltf, json, buffers};
  const primitives: Array<{
    primitive: GLTFMeshPrimitive;
    result: DracoEncodingResult;
  }> = [];

  for (const mesh of json.meshes || []) {
    for (const primitive of mesh.primitives || []) {
      const mode = primitive.mode ?? 4;
      if (mode !== 4) {
        if (dracoOptions.skipUnsupportedPrimitives ?? true) {
          continue;
        }
        throw new Error(
          `GLTF Draco writer cannot compress primitive mode ${mode}; only TRIANGLES (4) is supported`
        );
      }
      if (primitive.extensions?.[KHR_DRACO_MESH_COMPRESSION]) {
        throw new Error('GLTF Draco writer refuses to replace an existing Draco extension');
      }
      const meshData = getPrimitiveMesh(gltf, primitive);
      const result = await encodeDraco(meshData, {
        core: options.core,
        modules: options.modules,
        draco: dracoOptions
      });
      primitives.push({primitive, result});
    }
  }

  if (primitives.length === 0) {
    return output;
  }

  const originalBytes = getBufferBytes(buffers);
  let byteLength = originalBytes.byteLength;
  for (const {result} of primitives) {
    byteLength = alignTo4(byteLength) + result.data.byteLength;
  }
  const combinedBytes = new Uint8Array(byteLength);
  combinedBytes.set(originalBytes);

  json.bufferViews = json.bufferViews || [];
  json.buffers = json.buffers || [{byteLength: 0}];
  let byteOffset = alignTo4(originalBytes.byteLength);
  for (const {primitive, result} of primitives) {
    new Uint8Array(combinedBytes.buffer, byteOffset, result.data.byteLength).set(
      new Uint8Array(result.data)
    );
    const bufferView = json.bufferViews.length;
    json.bufferViews.push({buffer: 0, byteOffset, byteLength: result.data.byteLength});
    primitive.extensions = {
      ...(primitive.extensions || {}),
      [KHR_DRACO_MESH_COMPRESSION]: {
        bufferView,
        attributes: Object.fromEntries(
          Object.entries(result.report.attributes).map(([attributeName, attribute]) => [
            attributeName,
            attribute.id
          ])
        )
      }
    };
    byteOffset = alignTo4(byteOffset + result.data.byteLength);
  }

  const finalBytes = combinedBytes;
  output.buffers[0] = {
    ...(output.buffers[0] || {byteOffset: 0}),
    arrayBuffer: finalBytes.buffer,
    byteOffset: 0,
    byteLength: finalBytes.byteLength
  };
  json.buffers[0] = {...(json.buffers[0] || {}), byteLength: finalBytes.byteLength};
  json.extensionsUsed = addExtension(json.extensionsUsed, KHR_DRACO_MESH_COMPRESSION);
  return output;
}

/** Builds Draco input from one raw glTF primitive. */
function getPrimitiveMesh(gltf: GLTFWithBuffers, primitive: GLTFMeshPrimitive): DracoBuilderMesh {
  if (!primitive.attributes || primitive.attributes.POSITION === undefined) {
    throw new Error('GLTF Draco writer requires a POSITION attribute');
  }
  const attributes: Record<
    string,
    TypedArray | {value: TypedArray; size: number; normalized?: boolean}
  > = {};
  for (const [attributeName, accessorIndex] of Object.entries(primitive.attributes)) {
    const accessor = gltf.json.accessors?.[accessorIndex];
    if (!accessor) {
      throw new Error(`GLTF Draco writer could not resolve accessor ${accessorIndex}`);
    }
    if (accessor.sparse) {
      throw new Error(`GLTF Draco writer does not support sparse accessor ${accessorIndex}`);
    }
    const value = getStandardTypedArray(gltf, accessorIndex, accessor.componentType);
    attributes[attributeName] = {
      value,
      size: getComponentCount(accessor.type),
      ...(accessor.normalized === undefined ? {} : {normalized: accessor.normalized})
    };
  }

  let indices: TypedArray;
  if (primitive.indices !== undefined) {
    const accessor = gltf.json.accessors?.[primitive.indices];
    if (!accessor) {
      throw new Error(`GLTF Draco writer could not resolve index accessor ${primitive.indices}`);
    }
    indices = getStandardTypedArray(gltf, primitive.indices, accessor.componentType);
  } else {
    const positionAccessor = gltf.json.accessors?.[primitive.attributes.POSITION];
    if (!positionAccessor || positionAccessor.count % 3 !== 0) {
      throw new Error('GLTF Draco writer requires triangle-aligned POSITION data without indices');
    }
    indices = new Uint32Array(positionAccessor.count);
    for (let index = 0; index < indices.length; index++) {
      indices[index] = index;
    }
  }
  return {attributes, indices};
}

/** Returns an accessor array type accepted by the official Draco JS binding. */
function getStandardTypedArray(
  gltf: GLTFWithBuffers,
  accessorIndex: number,
  componentType: number
): TypedArray {
  const value = getTypedArrayForAccessor(gltf.json, gltf.buffers, accessorIndex);
  if (
    value instanceof BigInt64Array ||
    value instanceof BigUint64Array ||
    value instanceof Float64Array
  ) {
    throw new Error(
      `GLTF Draco writer does not support 64-bit accessor ${accessorIndex} (componentType ${componentType}); the official 1.5.7 encoder binding has no 64-bit attribute API`
    );
  }
  return value;
}

/** Clones the plain JSON portion without retaining caller-owned object identity. */
function cloneGLTFJson<T>(json: T): T {
  return JSON.parse(JSON.stringify(json)) as T;
}

/** Copies loaded buffer storage so appending compressed data cannot mutate input. */
function cloneBuffers(buffers: GLTFWithBuffers['buffers']): GLTFWithBuffers['buffers'] {
  return buffers.map(buffer => ({
    ...buffer,
    arrayBuffer: buffer.arrayBuffer.slice(0)
  }));
}

/** Returns the active bytes of the first loaded glTF buffer. */
function getBufferBytes(buffers: GLTFWithBuffers['buffers']): Uint8Array {
  const buffer = buffers[0] || {arrayBuffer: new ArrayBuffer(0), byteOffset: 0, byteLength: 0};
  return new Uint8Array(buffer.arrayBuffer, buffer.byteOffset || 0, buffer.byteLength);
}

/** Aligns a byte offset to the glTF-required four-byte boundary. */
function alignTo4(value: number): number {
  return (value + 3) & ~3;
}

/** Adds an extension name once while preserving the existing declaration order. */
function addExtension(extensions: string[] | undefined, extension: string): string[] {
  return extensions?.includes(extension) ? extensions : [...(extensions || []), extension];
}

/** Returns the number of scalar components represented by a glTF accessor type. */
function getComponentCount(type: string): number {
  switch (type) {
    case 'SCALAR':
      return 1;
    case 'VEC2':
      return 2;
    case 'VEC3':
      return 3;
    case 'VEC4':
      return 4;
    case 'MAT2':
      return 4;
    case 'MAT3':
      return 9;
    case 'MAT4':
      return 16;
    default:
      throw new Error(`GLTF Draco writer does not recognize accessor type ${type}`);
  }
}
