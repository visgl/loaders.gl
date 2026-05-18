// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/loader-utils';
import type {Mesh, MeshAttributes, MeshArrowTable, PackedMeshArrowLayout} from '@loaders.gl/schema';
import {
  convertMeshToTable,
  convertTableToMesh,
  makePackedMeshArrowTable
} from '@loaders.gl/schema-utils';
import type {PotreeAttribute} from '../types/potree-metadata';

/** Loader options for Potree binary point tiles. */
export type PotreeBinLoaderOptions = LoaderOptions & {
  potree?: {
    /** Selects mesh output or Apache Arrow output. */
    shape?: 'mesh' | 'arrow-table';
    /** Return packed interleaved Arrow point records for GPU buffer upload. */
    interleaved?: boolean;
    pointAttributes?: PotreeAttribute[];
    scale?: number;
    positionOrigin?: [number, number, number];
    nodeBoundingBox?: [number[], number[]];
  };
};

type ResolvedPotreeBinOptions = {
  pointAttributes: PotreeAttribute[];
  scale: number;
  positionOrigin: [number, number, number];
  nodeBoundingBox?: [number[], number[]];
};

/**
 * Parse a Potree 1.7 binary node into a minimal mesh.
 * The loader decodes only the attributes needed by the point-cloud tileset path.
 */
export function parsePotreeBin(
  arrayBuffer: ArrayBuffer,
  byteOffset = 0,
  options?: PotreeBinLoaderOptions
): Mesh | MeshArrowTable {
  validatePotreeInterleavedOptions(options);
  const resolvedOptions = getResolvedPotreeBinOptions(options);
  const pointByteSize = resolvedOptions.pointAttributes.reduce(
    (totalByteLength, pointAttribute) =>
      totalByteLength + getPotreeAttributeByteSize(pointAttribute),
    0
  );
  const byteLength = arrayBuffer.byteLength - byteOffset;
  const pointCount = byteLength / pointByteSize;

  if (!Number.isInteger(pointCount)) {
    throw new Error(
      `Potree binary tile has ${byteLength} bytes, which is not divisible by ${pointByteSize}`
    );
  }

  if (options?.potree?.interleaved) {
    return parsePackedPotreeBin(
      arrayBuffer,
      byteOffset,
      resolvedOptions,
      pointByteSize,
      pointCount
    );
  }

  const dataView = new DataView(arrayBuffer, byteOffset, byteLength);
  const positions = new Float32Array(pointCount * 3);
  const hasColor = resolvedOptions.pointAttributes.some(
    pointAttribute =>
      pointAttribute === 'COLOR_PACKED' ||
      pointAttribute === 'RGBA_PACKED' ||
      pointAttribute === 'RGB_PACKED'
  );
  const colors = hasColor ? new Uint8Array(pointCount * 3) : null;

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    let attributeByteOffset = pointIndex * pointByteSize;

    for (const pointAttribute of resolvedOptions.pointAttributes) {
      switch (pointAttribute) {
        case 'POSITION_CARTESIAN': {
          const positionIndex = pointIndex * 3;
          positions[positionIndex] =
            dataView.getInt32(attributeByteOffset, true) * resolvedOptions.scale +
            resolvedOptions.positionOrigin[0];
          positions[positionIndex + 1] =
            dataView.getInt32(attributeByteOffset + 4, true) * resolvedOptions.scale +
            resolvedOptions.positionOrigin[1];
          positions[positionIndex + 2] =
            dataView.getInt32(attributeByteOffset + 8, true) * resolvedOptions.scale +
            resolvedOptions.positionOrigin[2];
          attributeByteOffset += 12;
          break;
        }

        case 'RGB_PACKED':
        case 'COLOR_PACKED':
        case 'RGBA_PACKED': {
          if (colors) {
            const colorIndex = pointIndex * 3;
            colors[colorIndex] = dataView.getUint8(attributeByteOffset);
            colors[colorIndex + 1] = dataView.getUint8(attributeByteOffset + 1);
            colors[colorIndex + 2] = dataView.getUint8(attributeByteOffset + 2);
          }
          attributeByteOffset += getPotreeAttributeByteSize(pointAttribute);
          break;
        }

        default:
          attributeByteOffset += getPotreeAttributeByteSize(pointAttribute);
          break;
      }
    }
  }

  const attributes: MeshAttributes = {
    POSITION: {
      value: positions,
      size: 3
    }
  };

  if (colors) {
    attributes.COLOR_0 = {
      value: colors,
      size: 3
    };
  }

  const mesh: Mesh = {
    loader: 'potree',
    loaderData: {
      pointAttributes: resolvedOptions.pointAttributes,
      pointByteSize,
      scale: resolvedOptions.scale
    },
    header: {
      vertexCount: pointCount,
      boundingBox: resolvedOptions.nodeBoundingBox
    },
    mode: 0,
    topology: 'point-list',
    attributes,
    schema: {
      fields: [],
      metadata: {}
    }
  };

  const table = convertMeshToTable(mesh, 'arrow-table');
  if (options?.potree?.shape === 'arrow-table') {
    return table;
  }
  return {
    ...convertTableToMesh(table),
    loader: mesh.loader,
    loaderData: mesh.loaderData
  };
}

/** Parse one Potree binary tile directly into packed Mesh Arrow records. */
function parsePackedPotreeBin(
  arrayBuffer: ArrayBuffer,
  byteOffset: number,
  resolvedOptions: ResolvedPotreeBinOptions,
  pointByteSize: number,
  pointCount: number
): MeshArrowTable {
  const hasColor = resolvedOptions.pointAttributes.some(
    pointAttribute =>
      pointAttribute === 'COLOR_PACKED' ||
      pointAttribute === 'RGBA_PACKED' ||
      pointAttribute === 'RGB_PACKED'
  );
  const packedLayout = getPackedPotreeLayout(hasColor);
  const packedBytes = new Uint8Array(pointCount * packedLayout.byteStride);
  const packedView = new DataView(
    packedBytes.buffer,
    packedBytes.byteOffset,
    packedBytes.byteLength
  );
  const sourceView = new DataView(arrayBuffer, byteOffset, arrayBuffer.byteLength - byteOffset);
  const positionByteOffset = getRequiredPackedPotreeAttributeByteOffset(packedLayout, 'POSITION');
  const colorByteOffset = getPackedPotreeAttributeByteOffset(packedLayout, 'COLOR_0');

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    let attributeByteOffset = pointIndex * pointByteSize;
    const recordByteOffset = pointIndex * packedLayout.byteStride;

    for (const pointAttribute of resolvedOptions.pointAttributes) {
      switch (pointAttribute) {
        case 'POSITION_CARTESIAN': {
          packedView.setFloat32(
            recordByteOffset + positionByteOffset,
            sourceView.getInt32(attributeByteOffset, true) * resolvedOptions.scale +
              resolvedOptions.positionOrigin[0],
            true
          );
          packedView.setFloat32(
            recordByteOffset + positionByteOffset + 4,
            sourceView.getInt32(attributeByteOffset + 4, true) * resolvedOptions.scale +
              resolvedOptions.positionOrigin[1],
            true
          );
          packedView.setFloat32(
            recordByteOffset + positionByteOffset + 8,
            sourceView.getInt32(attributeByteOffset + 8, true) * resolvedOptions.scale +
              resolvedOptions.positionOrigin[2],
            true
          );
          attributeByteOffset += 12;
          break;
        }

        case 'RGB_PACKED':
        case 'COLOR_PACKED':
        case 'RGBA_PACKED': {
          if (colorByteOffset !== undefined) {
            const colorRecordByteOffset = recordByteOffset + colorByteOffset;
            packedBytes[colorRecordByteOffset] = sourceView.getUint8(attributeByteOffset);
            packedBytes[colorRecordByteOffset + 1] = sourceView.getUint8(attributeByteOffset + 1);
            packedBytes[colorRecordByteOffset + 2] = sourceView.getUint8(attributeByteOffset + 2);
            packedBytes[colorRecordByteOffset + 3] =
              pointAttribute === 'RGBA_PACKED' ? sourceView.getUint8(attributeByteOffset + 3) : 255;
          }
          attributeByteOffset += getPotreeAttributeByteSize(pointAttribute);
          break;
        }

        default:
          attributeByteOffset += getPotreeAttributeByteSize(pointAttribute);
          break;
      }
    }
  }

  return makePackedMeshArrowTable({
    bytes: packedBytes,
    vertexCount: pointCount,
    packedLayout,
    topology: 'point-list',
    mode: 0,
    boundingBox: resolvedOptions.nodeBoundingBox
  });
}

/** Return the packed Potree point layout mirrored into Arrow metadata. */
function getPackedPotreeLayout(hasColor: boolean): PackedMeshArrowLayout {
  const attributes: PackedMeshArrowLayout['attributes'] = [
    {attribute: 'POSITION', format: 'float32x3', byteOffset: 0}
  ];
  let byteOffset = 12;

  if (hasColor) {
    attributes.push({attribute: 'COLOR_0', format: 'unorm8x4', byteOffset});
    byteOffset += 4;
  }

  return {
    columnName: 'vertexData',
    bufferName: 'vertexData',
    byteStride: alignPackedByteStride(byteOffset),
    attributes
  };
}

/** Validate Potree packed output options before parsing. */
function validatePotreeInterleavedOptions(options?: PotreeBinLoaderOptions): void {
  if (options?.potree?.interleaved && options.potree.shape !== 'arrow-table') {
    throw new Error('PotreeBinLoader: potree.interleaved requires potree.shape="arrow-table"');
  }
}

/** Resolve an optional packed Potree attribute offset. */
function getPackedPotreeAttributeByteOffset(
  packedLayout: PackedMeshArrowLayout,
  attribute: string
): number | undefined {
  return packedLayout.attributes.find(layout => layout.attribute === attribute)?.byteOffset;
}

/** Resolve a required packed Potree attribute offset. */
function getRequiredPackedPotreeAttributeByteOffset(
  packedLayout: PackedMeshArrowLayout,
  attribute: string
): number {
  const byteOffset = getPackedPotreeAttributeByteOffset(packedLayout, attribute);
  if (byteOffset === undefined) {
    throw new Error(`PotreeBinLoader: packed layout is missing attribute "${attribute}"`);
  }
  return byteOffset;
}

/** Round a packed point byte stride up to 4-byte alignment. */
function alignPackedByteStride(byteOffset: number): number {
  return Math.ceil(byteOffset / 4) * 4;
}

/**
 * Validate and normalize Potree binary parser options.
 */
function getResolvedPotreeBinOptions(options?: PotreeBinLoaderOptions): ResolvedPotreeBinOptions {
  const pointAttributes = options?.potree?.pointAttributes;

  if (!pointAttributes?.length) {
    throw new Error('Potree binary parsing requires pointAttributes metadata');
  }

  return {
    pointAttributes,
    scale: options?.potree?.scale ?? 1,
    positionOrigin: options?.potree?.positionOrigin ?? [0, 0, 0],
    nodeBoundingBox: options?.potree?.nodeBoundingBox
  };
}

/**
 * Return the encoded byte length for a Potree binary point attribute.
 */
function getPotreeAttributeByteSize(pointAttribute: PotreeAttribute): number {
  switch (pointAttribute) {
    case 'POSITION_CARTESIAN':
      return 12;

    case 'RGBA_PACKED':
    case 'COLOR_PACKED':
      return 4;

    case 'RGB_PACKED':
      return 3;

    case 'INTENSITY':
    case 'NORMAL_SPHEREMAPPED':
    case 'NORMAL_OCT16':
      return 2;

    case 'CLASSIFICATION':
    case 'FILLER_1B':
      return 1;

    case 'NORMAL_FLOATS':
    case 'NORMAL':
      return 12;

    default:
      throw new Error(`Unsupported Potree point attribute: ${pointAttribute}`);
  }
}
