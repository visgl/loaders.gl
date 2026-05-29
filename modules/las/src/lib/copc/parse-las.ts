// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {MeshAttributes} from '@loaders.gl/schema';
import {concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';
import {getMeshBoundingBox} from '@loaders.gl/schema-utils';
import {Las} from 'copc';
import type {LASLoaderOptions} from '../../las-loader';
import {getLASSchema} from '../get-las-schema';
import type {LASHeader, LASMesh} from '../las-types';

const DEFAULT_BATCH_SIZE = 1000 * 100;

/**
 * Parse LAS/LAZ data using the laz-perf backend shipped by the COPC package.
 * @param arrayBuffer Complete LAS/LAZ file data
 * @param options LAS loader options
 * @returns Parsed LAS mesh
 */
export async function parseCOPCLAS(
  arrayBuffer: ArrayBuffer,
  options: LASLoaderOptions = {}
): Promise<LASMesh> {
  const header = Las.Header.parse(new Uint8Array(arrayBuffer));
  const batches = parseCOPCLASBatches(arrayBuffer, options, header.pointCount)[
    Symbol.asyncIterator
  ]();
  const firstBatch = await batches.next();

  if (!firstBatch.value) {
    throw new Error('LAS file contained no points');
  }
  return firstBatch.value;
}

/**
 * Parse LAS/LAZ data in decoded point batches using the COPC package.
 * @param arrayBufferIterator Iterator yielding LAS/LAZ binary chunks
 * @param options LAS loader options
 * @returns Async iterable of mesh batches
 */
export async function* parseCOPCLASInBatches(
  arrayBufferIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options: LASLoaderOptions = {}
): AsyncIterable<LASMesh> {
  const arrayBuffer = await concatenateArrayBuffersAsync(arrayBufferIterator);
  yield* parseCOPCLASBatches(arrayBuffer, options, getBatchSize(options));
}

/**
 * Parse LAS/LAZ data in decoded point batches using the COPC package.
 * @param arrayBuffer Complete LAS/LAZ file data
 * @param options LAS loader options
 * @param batchSize Number of returned points per batch
 * @returns Async iterable of mesh batches
 */
async function* parseCOPCLASBatches(
  arrayBuffer: ArrayBuffer,
  options: LASLoaderOptions,
  batchSize: number
): AsyncIterable<LASMesh> {
  const header = Las.Header.parse(new Uint8Array(arrayBuffer));
  const pointData = await getCOPCPointData(arrayBuffer, header);
  const view = Las.View.create(pointData, header);
  const totalToRead = view.pointCount;
  const lasHeader = getLASHeader(arrayBuffer, header, totalToRead);

  for (let pointIndex = 0; pointIndex < totalToRead; pointIndex += batchSize) {
    const batchPointCount = Math.min(batchSize, totalToRead - pointIndex);
    lasHeader.totalRead = pointIndex + batchPointCount;
    yield getLASMeshBatch(view, lasHeader, options, pointIndex, batchPointCount);
  }
}

/**
 * Decompress or slice LAS point records for the COPC package parser.
 * @param arrayBuffer Complete LAS/LAZ file data
 * @param header COPC package LAS header
 * @returns Uncompressed point records
 */
async function getCOPCPointData(arrayBuffer: ArrayBuffer, header: any): Promise<Uint8Array> {
  if (isCompressedLAS(arrayBuffer)) {
    return await Las.PointData.decompressFile(new Uint8Array(arrayBuffer));
  }

  const byteOffset = header.pointDataOffset;
  const byteLength = header.pointCount * header.pointDataRecordLength;
  return new Uint8Array(arrayBuffer, byteOffset, byteLength);
}

/**
 * Convert a COPC package header into loaders.gl LAS header metadata.
 * @param arrayBuffer Complete LAS/LAZ file data
 * @param header COPC package LAS header
 * @param totalToRead Number of output points
 * @returns loaders.gl LAS header
 */
function getLASHeader(arrayBuffer: ArrayBuffer, header: any, totalToRead: number): LASHeader {
  return {
    pointsOffset: header.pointDataOffset,
    pointsFormatId: header.pointDataRecordFormat,
    pointsStructSize: header.pointDataRecordLength,
    pointsCount: header.pointCount,
    scale: header.scale,
    offset: header.offset,
    maxs: header.max,
    mins: header.min,
    totalToRead,
    totalRead: 0,
    hasColor: hasCOPCColor(header.pointDataRecordFormat),
    versionAsString: `${header.majorVersion}.${header.minorVersion}`,
    isCompressed: isCompressedLAS(arrayBuffer)
  };
}

/**
 * Return true when the LAS point format includes compressed LAZ flags.
 * @param arrayBuffer Complete LAS/LAZ file data
 * @returns Whether the file uses LAZ compression
 */
function isCompressedLAS(arrayBuffer: ArrayBuffer): boolean {
  const rawPointFormat = new DataView(arrayBuffer).getUint8(104);
  return Boolean(rawPointFormat & 0xc0);
}

/**
 * Return true when a COPC-supported LAS point format includes RGB color.
 * @param pointDataRecordFormat LAS point data record format
 * @returns Whether the point format has color
 */
function hasCOPCColor(pointDataRecordFormat: number): boolean {
  return pointDataRecordFormat === 2 || pointDataRecordFormat === 3 || pointDataRecordFormat >= 7;
}

/**
 * Build one LAS mesh batch from a COPC package point view.
 * @param view COPC package point view
 * @param lasHeader LAS header metadata
 * @param options LAS loader options
 * @param pointOffset Output point offset
 * @param batchPointCount Number of points in this batch
 * @returns LAS mesh batch
 */
function getLASMeshBatch(
  view: any,
  lasHeader: LASHeader,
  options: LASLoaderOptions,
  pointOffset: number,
  batchPointCount: number
): LASMesh {
  const PositionsType = options.las?.fp64 ? Float64Array : Float32Array;
  const positions = new PositionsType(batchPointCount * 3);
  const colors = lasHeader.hasColor ? new Uint8Array(batchPointCount * 4) : null;
  const intensities = new Uint16Array(batchPointCount);
  const classifications = new Uint8Array(batchPointCount);
  const getX = view.getter('X');
  const getY = view.getter('Y');
  const getZ = view.getter('Z');
  const getIntensity = view.getter('Intensity');
  const getClassification = view.getter('Classification');
  const getRed = colors ? view.getter('Red') : null;
  const getGreen = colors ? view.getter('Green') : null;
  const getBlue = colors ? view.getter('Blue') : null;
  const twoByteColor = detectTwoByteColors(view, pointOffset, batchPointCount, options);

  for (let i = 0; i < batchPointCount; i++) {
    const sourcePointIndex = pointOffset + i;
    positions[i * 3] = getX(sourcePointIndex);
    positions[i * 3 + 1] = getY(sourcePointIndex);
    positions[i * 3 + 2] = getZ(sourcePointIndex);
    intensities[i] = getIntensity(sourcePointIndex);
    classifications[i] = getClassification(sourcePointIndex);

    if (colors && getRed && getGreen && getBlue) {
      const red = getRed(sourcePointIndex);
      const green = getGreen(sourcePointIndex);
      const blue = getBlue(sourcePointIndex);
      colors[i * 4] = twoByteColor ? red / 256 : red;
      colors[i * 4 + 1] = twoByteColor ? green / 256 : green;
      colors[i * 4 + 2] = twoByteColor ? blue / 256 : blue;
      colors[i * 4 + 3] = 255;
    }
  }

  const attributes: MeshAttributes = {
    POSITION: {value: positions, size: 3},
    intensity: {value: intensities, size: 1},
    classification: {value: classifications, size: 1}
  };

  if (colors) {
    attributes.COLOR_0 = {value: colors, size: 4};
  }

  const batchHeader = {...lasHeader};
  const lasMesh: LASMesh = {
    loader: 'las',
    loaderData: batchHeader,
    schema: {fields: [], metadata: {}},
    header: {
      vertexCount: batchPointCount,
      boundingBox: getMeshBoundingBox(attributes)
    },
    attributes,
    topology: 'point-list',
    mode: 0,
    progress: lasHeader.totalRead / lasHeader.totalToRead
  } as LASMesh & {progress: number};

  lasMesh.schema = getLASSchema(batchHeader, lasMesh.attributes);
  return lasMesh;
}

/**
 * Detect whether color values use 16-bit LAS color range.
 * @param view COPC package point view
 * @param pointOffset Output point offset
 * @param batchPointCount Number of points in this batch
 * @param options LAS loader options
 * @returns Whether color values should be downscaled from 16-bit to 8-bit
 */
function detectTwoByteColors(
  view: any,
  pointOffset: number,
  batchPointCount: number,
  options: LASLoaderOptions
): boolean {
  switch (options.las?.colorDepth) {
    case 8:
      return false;
    case 16:
      return true;
    case 'auto': {
      const getRed = view.getter('Red');
      const getGreen = view.getter('Green');
      const getBlue = view.getter('Blue');
      for (let i = 0; i < batchPointCount; i++) {
        const sourcePointIndex = pointOffset + i;
        if (
          getRed(sourcePointIndex) > 255 ||
          getGreen(sourcePointIndex) > 255 ||
          getBlue(sourcePointIndex) > 255
        ) {
          return true;
        }
      }
      return false;
    }
    default:
      return false;
  }
}

/**
 * Get the requested LAS point batch size.
 * @param options LAS loader options
 * @returns Point count per decoded batch
 */
function getBatchSize(options: LASLoaderOptions): number {
  const batchSize = options.batchSize ?? options.core?.batchSize;
  return typeof batchSize === 'number' ? batchSize : DEFAULT_BATCH_SIZE;
}
