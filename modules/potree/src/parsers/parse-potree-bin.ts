// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/loader-utils';
import type {Mesh, MeshAttributes, MeshArrowTable} from '@loaders.gl/schema';
import {convertMeshToTable, convertTableToMesh} from '@loaders.gl/schema-utils';
import type {PotreeAttribute} from '../types/potree-metadata';

/** Loader options for Potree binary point tiles. */
export type PotreeBinLoaderOptions = LoaderOptions & {
  potree?: {
    /** Selects mesh output or Apache Arrow output. */
    shape?: 'mesh' | 'arrow-table';
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
 * Parse a Potree 1.7 binary node into a typed point-attribute mesh.
 */
export function parsePotreeBin(
  arrayBuffer: ArrayBuffer,
  byteOffset = 0,
  options?: PotreeBinLoaderOptions
): Mesh | MeshArrowTable {
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

  const dataView = new DataView(arrayBuffer, byteOffset, byteLength);
  const positions = new Float32Array(pointCount * 3);
  const hasColor = resolvedOptions.pointAttributes.some(
    pointAttribute =>
      pointAttribute === 'COLOR_PACKED' ||
      pointAttribute === 'RGBA_PACKED' ||
      pointAttribute === 'RGB_PACKED'
  );
  const colors = hasColor ? new Uint8Array(pointCount * 3) : null;
  const intensities = resolvedOptions.pointAttributes.includes('INTENSITY')
    ? new Uint16Array(pointCount)
    : null;
  const classifications = resolvedOptions.pointAttributes.includes('CLASSIFICATION')
    ? new Uint8Array(pointCount)
    : null;
  const normalFloats = resolvedOptions.pointAttributes.includes('NORMAL_FLOATS')
    ? new Float32Array(pointCount * 3)
    : null;
  const normals = resolvedOptions.pointAttributes.includes('NORMAL')
    ? new Float32Array(pointCount * 3)
    : null;
  const sphereMappedNormals = resolvedOptions.pointAttributes.includes('NORMAL_SPHEREMAPPED')
    ? new Uint8Array(pointCount * 2)
    : null;
  const oct16Normals = resolvedOptions.pointAttributes.includes('NORMAL_OCT16')
    ? new Uint16Array(pointCount)
    : null;

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

        case 'INTENSITY':
          intensities![pointIndex] = dataView.getUint16(attributeByteOffset, true);
          attributeByteOffset += 2;
          break;

        case 'CLASSIFICATION':
          classifications![pointIndex] = dataView.getUint8(attributeByteOffset);
          attributeByteOffset += 1;
          break;

        case 'NORMAL_FLOATS': {
          const normalIndex = pointIndex * 3;
          normalFloats![normalIndex] = dataView.getFloat32(attributeByteOffset, true);
          normalFloats![normalIndex + 1] = dataView.getFloat32(attributeByteOffset + 4, true);
          normalFloats![normalIndex + 2] = dataView.getFloat32(attributeByteOffset + 8, true);
          attributeByteOffset += 12;
          break;
        }

        case 'NORMAL': {
          const normalIndex = pointIndex * 3;
          normals![normalIndex] = dataView.getFloat32(attributeByteOffset, true);
          normals![normalIndex + 1] = dataView.getFloat32(attributeByteOffset + 4, true);
          normals![normalIndex + 2] = dataView.getFloat32(attributeByteOffset + 8, true);
          attributeByteOffset += 12;
          break;
        }

        case 'NORMAL_SPHEREMAPPED': {
          const normalIndex = pointIndex * 2;
          sphereMappedNormals![normalIndex] = dataView.getUint8(attributeByteOffset);
          sphereMappedNormals![normalIndex + 1] = dataView.getUint8(attributeByteOffset + 1);
          attributeByteOffset += 2;
          break;
        }

        case 'NORMAL_OCT16':
          oct16Normals![pointIndex] = dataView.getUint16(attributeByteOffset, true);
          attributeByteOffset += 2;
          break;

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
    },
    POSITION_CARTESIAN: {
      value: positions,
      size: 3
    }
  };

  if (colors) {
    attributes.COLOR_0 = {
      value: colors,
      size: 3
    };
    const colorAttributeName = resolvedOptions.pointAttributes.find(
      pointAttribute =>
        pointAttribute === 'COLOR_PACKED' ||
        pointAttribute === 'RGBA_PACKED' ||
        pointAttribute === 'RGB_PACKED'
    );
    if (colorAttributeName) {
      attributes[colorAttributeName] = {value: colors, size: 3};
    }
  }
  if (intensities) attributes.INTENSITY = {value: intensities, size: 1};
  if (classifications) attributes.CLASSIFICATION = {value: classifications, size: 1};
  if (normalFloats) {
    attributes.NORMAL_FLOATS = {value: normalFloats, size: 3};
  }
  if (normals) {
    attributes.NORMAL = {value: normals, size: 3};
  } else if (normalFloats) {
    attributes.NORMAL = {value: normalFloats, size: 3};
  }
  if (sphereMappedNormals) {
    attributes.NORMAL_SPHEREMAPPED = {value: sphereMappedNormals, size: 2};
  }
  if (oct16Normals) attributes.NORMAL_OCT16 = {value: oct16Normals, size: 1};

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
