// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {
  GLTF,
  GLTFBoundingVolume,
  GLTFFile,
  GLTFNode,
  GLTFShape,
  GLTFWithBuffers
} from '@loaders.gl/gltf';
import {Matrix4} from '@math.gl/core';
import {CachedUriResolver} from '@loaders.gl/loader-utils';
import type {
  Tile3DBoundingVolume,
  Tiles3DTileContentJSON,
  Tiles3DTileJSON,
  Tiles3DTilesetJSON
} from '../../types';

const TILESET_EXTENSION = '3DTILES_tileset';
const VECTOR_EXTENSION = '3DTILES_tileset_vectors';

/** Internal, structured-cloneable description of one glTF package file. */
export type Tiles3DPackageFile = {
  name?: string;
  mimeType: string;
  uri?: string;
  originalUri?: string;
  data?: ArrayBuffer;
  byteOffset: number;
  byteLength: number;
  bufferUri?: string;
};

/** Internal reference from a normalized tile content header into its owning glTF package. */
export type Tiles3DPackageResource = {
  fileIndex: number;
  files: Tiles3DPackageFile[];
};

/** Tests whether parsed glTF is a draft 3D Tiles 2.0 tileset. */
export function is3DTiles2Tileset(gltf: GLTFWithBuffers): boolean {
  return isRecord(gltf.json.extensions?.[TILESET_EXTENSION]);
}

/** Tests whether parsed glTF is a draft 3D Tiles 2.0 subtree resource. */
export function is3DTiles2Subtree(gltf: GLTFWithBuffers): boolean {
  return isRecord(gltf.json.extensions?.['3DTILES_subtree']);
}

/**
 * Adapts an explicit draft 3D Tiles 2.0 glTF hierarchy to the normalized 3D Tiles header model.
 *
 * External assets remain lazy: URI files are represented by resolved URLs, while buffer-view
 * files retain structured-cloneable byte ranges and their package-name lookup table.
 *
 * @param gltf - Parsed glTF container.
 * @param basePath - Base path of the tileset resource.
 * @returns A 1.x-shaped header tree tagged as draft 2.0.
 */
export function parse3DTiles2Tileset(gltf: GLTFWithBuffers, basePath: string): Tiles3DTilesetJSON {
  const json = gltf.json;
  validateTilesetStructure(json);
  const tilesetExtension = json.extensions?.[TILESET_EXTENSION] as {geometricError: number};
  const scene = json.scenes![json.scene!];
  const rootNodeIndex = scene.nodes![0];
  const resourceResolver = new CachedUriResolver(basePath);
  const files = createPackageFiles(gltf, resourceResolver);
  const vectorExtension = json.extensions?.[VECTOR_EXTENSION] as {clip?: boolean} | undefined;
  if (vectorExtension?.clip !== undefined && typeof vectorExtension.clip !== 'boolean') {
    throw new Error('3DTILES_tileset_vectors: clip must be boolean when present');
  }
  const vectorContent = vectorExtension ? {clip: vectorExtension.clip === true} : undefined;
  const ancestorNodeIndices = new Set<number>();
  const root = convertNode(json, rootNodeIndex, files, vectorContent, ancestorNodeIndices, true);

  return {
    asset: json.asset,
    geometricError: tilesetExtension.geometricError,
    root,
    extensionsUsed: json.extensionsUsed,
    extensionsRequired: json.extensionsRequired,
    extensions: json.extensions,
    extras: json.extras
  } as Tiles3DTilesetJSON;
}

/** Validates the explicit hierarchy invariants required by the draft extension. */
function validateTilesetStructure(json: GLTF): void {
  const tilesetExtension = json.extensions?.[TILESET_EXTENSION] as
    | {geometricError?: unknown}
    | undefined;
  if (!tilesetExtension || !isNonnegativeNumber(tilesetExtension.geometricError)) {
    throw new Error('3DTILES_tileset: top-level geometricError must be a nonnegative number');
  }
  if (json.scenes?.length !== 1 || json.scene !== 0 || json.scenes[0].nodes?.length !== 1) {
    throw new Error('3DTILES_tileset: glTF must define one scene with one root node');
  }
  const rootNodeIndex = json.scenes[0].nodes[0];
  if (!Number.isInteger(rootNodeIndex) || !json.nodes?.[rootNodeIndex]) {
    throw new Error(`3DTILES_tileset: invalid root node ${rootNodeIndex}`);
  }
}

/** Converts one glTF node and its descendants without loading external assets. */
function convertNode(
  json: GLTF,
  nodeIndex: number,
  files: Tiles3DPackageFile[],
  vectorContent: {clip: boolean} | undefined,
  ancestorNodeIndices: Set<number>,
  isRoot: boolean
): Tiles3DTileJSON {
  const node = json.nodes?.[nodeIndex];
  if (!node) {
    throw new Error(`3DTILES_tileset: invalid child node ${nodeIndex}`);
  }
  if (ancestorNodeIndices.has(nodeIndex)) {
    throw new Error(`3DTILES_tileset: node hierarchy contains a cycle at node ${nodeIndex}`);
  }
  const extension = node.extensions?.[TILESET_EXTENSION] as
    | {geometricError?: unknown; refine?: unknown; content?: {boundingVolume?: GLTFBoundingVolume}}
    | undefined;
  if (!extension || !isNonnegativeNumber(extension.geometricError)) {
    throw new Error(`3DTILES_tileset: node ${nodeIndex} requires a nonnegative geometricError`);
  }
  if (isRoot && extension.refine !== 'ADD' && extension.refine !== 'REPLACE') {
    throw new Error('3DTILES_tileset: root node requires ADD or REPLACE refinement');
  }
  if (!node.boundingVolume) {
    throw new Error(`3DTILES_tileset: node ${nodeIndex} requires a boundingVolume`);
  }
  if (node.mesh !== undefined) {
    throw new Error(`3DTILES_tileset: tile node ${nodeIndex} must not define a mesh`);
  }
  const nextAncestors = new Set(ancestorNodeIndices);
  nextAncestors.add(nodeIndex);
  return {
    boundingVolume: convertBoundingVolume(json, node.boundingVolume, `node ${nodeIndex}`),
    geometricError: extension.geometricError as number,
    refine: extension.refine as string | undefined,
    transform: getNodeMatrix(node),
    content: createContent(json, node, files, vectorContent, extension.content, nodeIndex),
    children: (node.children || []).map(childNodeIndex =>
      convertNode(json, childNodeIndex, files, vectorContent, nextAncestors, false)
    ),
    extensions: node.extensions,
    extras: node.extras
  };
}

/** Creates one lazy normalized content reference from a node external asset. */
function createContent(
  json: GLTF,
  node: GLTFNode,
  files: Tiles3DPackageFile[],
  vectorContent: {clip: boolean} | undefined,
  contentMetadata: {boundingVolume?: GLTFBoundingVolume} | undefined,
  nodeIndex: number
): Tiles3DTileContentJSON | undefined {
  if (node.externalAsset === undefined) {
    if (contentMetadata) {
      throw new Error(`3DTILES_tileset: content metadata on empty node ${nodeIndex}`);
    }
    return undefined;
  }
  const externalAsset = json.externalAssets?.[node.externalAsset];
  if (!externalAsset) {
    throw new Error(
      `3DTILES_tileset: node ${nodeIndex} references missing external asset ${node.externalAsset}`
    );
  }
  const file = json.files?.[externalAsset.file];
  if (!file || !files[externalAsset.file]) {
    throw new Error(
      `3DTILES_tileset: external asset ${node.externalAsset} references missing file ${externalAsset.file}`
    );
  }
  const content = {
    uri: file.uri || file.name || `embedded-${externalAsset.file}`,
    boundingVolume: contentMetadata?.boundingVolume
      ? convertBoundingVolume(json, contentMetadata.boundingVolume, `node ${nodeIndex} content`)
      : undefined,
    extensions: contentMetadata
      ? (contentMetadata as {extensions?: Record<string, unknown>}).extensions
      : undefined,
    _resource: {fileIndex: externalAsset.file, files} satisfies Tiles3DPackageResource,
    _vectorContent: vectorContent
  };
  return content as Tiles3DTileContentJSON;
}

/** Creates structured-cloneable lazy file records for the complete package. */
function createPackageFiles(
  gltf: GLTFWithBuffers,
  resourceResolver: CachedUriResolver
): Tiles3DPackageFile[] {
  return (gltf.json.files || []).map((file, fileIndex) =>
    createPackageFile(gltf, file, fileIndex, resourceResolver)
  );
}

/** Creates one URI- or buffer-view-backed package file record. */
function createPackageFile(
  gltf: GLTFWithBuffers,
  file: GLTFFile,
  fileIndex: number,
  resourceResolver: CachedUriResolver
): Tiles3DPackageFile {
  if (!file.mimeType) {
    throw new Error(`3DTILES_tileset: file ${fileIndex} requires mimeType`);
  }
  if ((file.uri === undefined) === (file.bufferView === undefined)) {
    throw new Error(`3DTILES_tileset: file ${fileIndex} must define exactly one data source`);
  }
  if (file.uri !== undefined) {
    return {
      name: file.name,
      mimeType: file.mimeType,
      uri: resourceResolver.resolve(file.uri),
      originalUri: file.uri,
      byteOffset: 0,
      byteLength: 0
    };
  }

  const bufferView = gltf.json.bufferViews?.[file.bufferView!];
  if (!bufferView) {
    throw new Error(`3DTILES_tileset: file ${fileIndex} references missing bufferView`);
  }
  const buffer = gltf.buffers?.[bufferView.buffer];
  const bufferDefinition = gltf.json.buffers?.[bufferView.buffer];
  const byteOffset = (buffer?.byteOffset || 0) + (bufferView.byteOffset || 0);
  if (buffer?.arrayBuffer) {
    return {
      name: file.name,
      mimeType: file.mimeType,
      data: buffer.arrayBuffer,
      byteOffset,
      byteLength: bufferView.byteLength
    };
  }
  if (bufferDefinition?.uri) {
    return {
      name: file.name,
      mimeType: file.mimeType,
      bufferUri: resourceResolver.resolve(bufferDefinition.uri),
      byteOffset: bufferView.byteOffset || 0,
      byteLength: bufferView.byteLength
    };
  }
  throw new Error(`3DTILES_tileset: embedded file ${fileIndex} has no available buffer data`);
}

/** Converts a draft glTF box or sphere to the 3D Tiles runtime volume representation. */
function convertBoundingVolume(
  json: GLTF,
  boundingVolume: GLTFBoundingVolume,
  label: string
): Tile3DBoundingVolume {
  const shape = json.shapes?.[boundingVolume.shape] as GLTFShape | undefined;
  if (!shape) {
    throw new Error(`3DTILES_tileset: ${label} references missing shape ${boundingVolume.shape}`);
  }
  const matrix = getTransformMatrix(boundingVolume);
  if (shape.type === 'box' && shape.box?.size?.length === 3) {
    const [sizeX, sizeY, sizeZ] = shape.box.size;
    return {
      box: [
        matrix[12],
        matrix[13],
        matrix[14],
        (matrix[0] * sizeX) / 2,
        (matrix[1] * sizeX) / 2,
        (matrix[2] * sizeX) / 2,
        (matrix[4] * sizeY) / 2,
        (matrix[5] * sizeY) / 2,
        (matrix[6] * sizeY) / 2,
        (matrix[8] * sizeZ) / 2,
        (matrix[9] * sizeZ) / 2,
        (matrix[10] * sizeZ) / 2
      ]
    };
  }
  if (shape.type === 'sphere' && isNonnegativeNumber(shape.sphere?.radius)) {
    const maximumScale = Math.max(
      Math.hypot(matrix[0], matrix[1], matrix[2]),
      Math.hypot(matrix[4], matrix[5], matrix[6]),
      Math.hypot(matrix[8], matrix[9], matrix[10])
    );
    return {
      sphere: [matrix[12], matrix[13], matrix[14], shape.sphere.radius * maximumScale]
    };
  }
  throw new Error(`3DTILES_tileset: unsupported ${label} shape type ${shape.type}`);
}

/** Returns a column-major node transform from matrix or TRS form. */
function getNodeMatrix(node: GLTFNode): number[] | undefined {
  if (node.matrix) {
    return [...node.matrix];
  }
  if (!node.translation && !node.rotation && !node.scale) {
    return undefined;
  }
  return Array.from(
    new Matrix4()
      .translate(node.translation || [0, 0, 0])
      .multiplyRight(new Matrix4().fromQuaternion(node.rotation || [0, 0, 0, 1]))
      .scale(node.scale || [1, 1, 1])
  );
}

/** Returns a concrete matrix for a bounding-volume matrix or TRS definition. */
function getTransformMatrix(boundingVolume: GLTFBoundingVolume): Matrix4 {
  if (boundingVolume.matrix) {
    return new Matrix4(boundingVolume.matrix);
  }
  return new Matrix4()
    .translate(boundingVolume.translation || [0, 0, 0])
    .multiplyRight(new Matrix4().fromQuaternion(boundingVolume.rotation || [0, 0, 0, 1]))
    .scale(boundingVolume.scale || [1, 1, 1]);
}

/** Tests whether a value is a finite nonnegative number. */
function isNonnegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/** Tests whether a value is a non-array object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
