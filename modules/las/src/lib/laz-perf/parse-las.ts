// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// ported and es6-ified from https://github.com/verma/plasio/
// import type {ArrowTable, ColumnarTable} from '@loaders.gl/schema';
import type {LASLoaderOptions} from '../../las-loader';
import type {LASMesh, LASHeader} from '../las-types';
import type {MeshArrowTable, MeshAttributes, PackedMeshArrowLayout} from '@loaders.gl/schema';
import {getMeshBoundingBox /* , convertMeshToTable */} from '@loaders.gl/schema-utils';
import {concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';
import {getLASSchema} from '../get-las-schema';
import {getPackedLASLayout, makePackedLASArrowTable} from '../make-packed-las-arrow-table';
import {LASFile} from './laslaz-decoder';

type LASChunk = {
  count: number;
  buffer: ArrayBuffer;
  hasMoreData: boolean;
};

type LASDecoder = {
  pointsCount: number;
  getPoint(index: number): {
    position: [number, number, number];
    color?: [number, number, number];
    intensity: number;
    classification: number;
  };
};

type LASDecodedChunk = {
  decoder: LASDecoder;
  header: LASHeader;
};

const DEFAULT_BATCH_SIZE = 1000 * 100;

/**
 * Parsing of .las file
 * @param arrayBuffer
 * @param options
 * @returns LASMesh
 */
export function parseLAS(arrayBuffer: ArrayBuffer, options?: LASLoaderOptions): LASMesh {
  return parseLASMesh(arrayBuffer, options);
  // This code breaks pointcloud example on the website
  // const mesh = parseLASMesh(arrayBuffer, options);
  // return convertMeshToTable(mesh, options?.las?.shape || 'mesh') as LASMesh | ArrowTable | ColumnarTable;
}

/**
 * Parse LAS/LAZ data directly into one packed interleaved Arrow table.
 * @param arrayBuffer Complete LAS/LAZ file bytes.
 * @param options LAS loader options.
 * @returns Packed-only Mesh Arrow output without intermediate attribute arrays.
 */
export function parseLASPackedArrowTable(
  arrayBuffer: ArrayBuffer,
  options: LASLoaderOptions = {}
): MeshArrowTable {
  let originalHeader: LASHeader | null = null;
  let packedLayout: PackedMeshArrowLayout | null = null;
  let packedBytes: Uint8Array | null = null;
  let vertexCount = 0;
  const boundingBox = createPackedLASBoundingBox();

  for (const {decoder, header} of parseLASChunkedIterator(
    arrayBuffer,
    options.las?.skip,
    getBatchSize(options)
  )) {
    if (!originalHeader) {
      originalHeader = header;
      packedLayout = getPackedLASLayout(header.hasColor);
      packedBytes = new Uint8Array(header.totalToRead * packedLayout.byteStride);
    }

    writePackedLASRecords(
      decoder,
      header,
      options,
      packedBytes!,
      packedLayout!,
      vertexCount,
      boundingBox
    );
    vertexCount += decoder.pointsCount;
  }

  if (!originalHeader || !packedLayout || !packedBytes) {
    throw new Error('LASLoader: packed LAS parsing did not produce header metadata');
  }

  return makePackedLASArrowTable({
    bytes: packedBytes,
    vertexCount,
    lasHeader: originalHeader,
    boundingBox: finalizePackedLASBoundingBox(boundingBox, vertexCount),
    packedLayout
  });
}

/**
 * Parse LAS/LAZ data in decoded point batches.
 * @param arrayBufferIterator Iterator yielding LAS/LAZ binary chunks
 * @param options LAS loader options
 * @returns Async iterable of mesh batches
 */
export async function* parseLASInBatches(
  arrayBufferIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options: LASLoaderOptions = {}
): AsyncIterable<LASMesh> {
  const arrayBuffer = await concatenateArrayBuffersAsync(arrayBufferIterator);
  const batchSize = getBatchSize(options);

  for (const {decoder, header} of parseLASChunkedIterator(
    arrayBuffer,
    options.las?.skip,
    batchSize
  )) {
    yield parseLASMeshBatch(decoder, header, options);
  }
}

/**
 * Parse LAS/LAZ data directly into packed interleaved Arrow batches.
 * @param arrayBufferIterator Iterator yielding LAS/LAZ binary chunks.
 * @param options LAS loader options.
 * @returns Async iterable of packed-only Mesh Arrow batches.
 */
export async function* parseLASPackedArrowTableInBatches(
  arrayBufferIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options: LASLoaderOptions = {}
): AsyncIterable<MeshArrowTable> {
  const arrayBuffer = await concatenateArrayBuffersAsync(arrayBufferIterator);
  const batchSize = getBatchSize(options);

  for (const {decoder, header} of parseLASChunkedIterator(
    arrayBuffer,
    options.las?.skip,
    batchSize
  )) {
    const packedLayout = getPackedLASLayout(header.hasColor);
    const packedBytes = new Uint8Array(decoder.pointsCount * packedLayout.byteStride);
    const boundingBox = createPackedLASBoundingBox();

    writePackedLASRecords(decoder, header, options, packedBytes, packedLayout, 0, boundingBox);

    yield makePackedLASArrowTable({
      bytes: packedBytes,
      vertexCount: decoder.pointsCount,
      lasHeader: {...header},
      boundingBox: finalizePackedLASBoundingBox(boundingBox, decoder.pointsCount),
      packedLayout
    });
  }
}

/**
 * Parsing of .las file
 * @param arrayBuffer
 * @param options
 * @returns LASHeader
 */
function parseLASMesh(arrayBuffer: ArrayBuffer, options: LASLoaderOptions = {}): LASMesh {
  let pointIndex: number = 0;

  let positions: Float32Array | Float64Array;
  let colors: Uint8Array | null;
  let intensities: Uint16Array;
  let classifications: Uint8Array;
  let originalHeader: any;

  const lasMesh: LASMesh = {
    loader: 'las',
    loaderData: {} as LASHeader,
    // shape: 'mesh',
    schema: {fields: [], metadata: {}},
    header: {
      vertexCount: 0,
      boundingBox: [
        [0, 0, 0],
        [0, 0, 0]
      ]
    },
    attributes: {},
    topology: 'point-list',
    mode: 0 // GL.POINTS
  };

  /* eslint-disable max-statements */
  // @ts-ignore Possibly undefined
  parseLASChunked(arrayBuffer, options.las?.skip, (decoder: any = {}, lasHeader: LASHeader) => {
    if (!originalHeader) {
      originalHeader = lasHeader;
      const total = lasHeader.totalToRead;

      const PositionsType = options.las?.fp64 ? Float64Array : Float32Array;
      positions = new PositionsType(total * 3);
      // laslaz-decoder.js `pointFormatReaders`
      colors = lasHeader.hasColor ? new Uint8Array(total * 4) : null;
      intensities = new Uint16Array(total);
      classifications = new Uint8Array(total);

      lasMesh.loaderData = lasHeader;
      lasMesh.attributes = {
        POSITION: {value: positions, size: 3},
        // non-gltf attributes, use non-capitalized names for now
        intensity: {value: intensities, size: 1},
        classification: {value: classifications, size: 1}
      };

      if (colors) {
        lasMesh.attributes.COLOR_0 = {value: colors, size: 4};
      }
    }

    const batchSize = decoder.pointsCount;
    const {
      scale: [scaleX, scaleY, scaleZ],
      offset: [offsetX, offsetY, offsetZ]
    } = lasHeader;

    const twoByteColor = detectTwoByteColors(decoder, batchSize, options.las?.colorDepth);

    for (let i = 0; i < batchSize; i++) {
      const {position, color, intensity, classification} = decoder.getPoint(i);

      positions[pointIndex * 3] = position[0] * scaleX + offsetX;
      positions[pointIndex * 3 + 1] = position[1] * scaleY + offsetY;
      positions[pointIndex * 3 + 2] = position[2] * scaleZ + offsetZ;

      if (color && colors) {
        if (twoByteColor) {
          colors[pointIndex * 4] = color[0] / 256;
          colors[pointIndex * 4 + 1] = color[1] / 256;
          colors[pointIndex * 4 + 2] = color[2] / 256;
        } else {
          colors[pointIndex * 4] = color[0];
          colors[pointIndex * 4 + 1] = color[1];
          colors[pointIndex * 4 + 2] = color[2];
        }
        colors[pointIndex * 4 + 3] = 255;
      }

      intensities[pointIndex] = intensity;
      classifications[pointIndex] = classification;

      pointIndex++;
    }

    const meshBatch = {
      ...lasMesh,
      header: {
        vertexCount: lasHeader.totalRead
      },
      progress: lasHeader.totalRead / lasHeader.totalToRead
    };

    options?.onProgress?.(meshBatch);
  });
  /* eslint-enable max-statements */

  lasMesh.header = {
    vertexCount: originalHeader.totalToRead,
    boundingBox: getMeshBoundingBox(lasMesh?.attributes || {})
  };

  if (lasMesh) {
    lasMesh.schema = getLASSchema(lasMesh.loaderData, lasMesh.attributes);
  }
  return lasMesh;
}

/**
 * Convert one decoded LAS/LAZ chunk into a mesh.
 * @param decoder Point decoder for the current chunk
 * @param lasHeader LAS file header with current progress
 * @param options LAS loader options
 * @returns Mesh containing one decoded point batch
 */
function parseLASMeshBatch(
  decoder: LASDecoder,
  lasHeader: LASHeader,
  options: LASLoaderOptions = {}
): LASMesh {
  const batchSize = decoder.pointsCount;
  const PositionsType = options.las?.fp64 ? Float64Array : Float32Array;
  const positions = new PositionsType(batchSize * 3);
  const colors = lasHeader.hasColor ? new Uint8Array(batchSize * 4) : null;
  const intensities = new Uint16Array(batchSize);
  const classifications = new Uint8Array(batchSize);

  populateLASAttributes(decoder, lasHeader, options, {
    positions,
    colors,
    intensities,
    classifications,
    pointOffset: 0
  });

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
      vertexCount: batchSize,
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
 * Fill typed LAS attribute arrays from a decoded chunk.
 * @param decoder Point decoder for the current chunk
 * @param lasHeader LAS file header
 * @param options LAS loader options
 * @param target Target attribute arrays and write offset
 */
function populateLASAttributes(
  decoder: LASDecoder,
  lasHeader: LASHeader,
  options: LASLoaderOptions,
  target: {
    positions: Float32Array | Float64Array;
    colors: Uint8Array | null;
    intensities: Uint16Array;
    classifications: Uint8Array;
    pointOffset: number;
  }
): void {
  const batchSize = decoder.pointsCount;
  const {
    scale: [scaleX, scaleY, scaleZ],
    offset: [offsetX, offsetY, offsetZ]
  } = lasHeader;
  const twoByteColor = detectTwoByteColors(decoder, batchSize, options.las?.colorDepth);

  for (let i = 0; i < batchSize; i++) {
    const {position, color, intensity, classification} = decoder.getPoint(i);
    const pointIndex = target.pointOffset + i;

    target.positions[pointIndex * 3] = position[0] * scaleX + offsetX;
    target.positions[pointIndex * 3 + 1] = position[1] * scaleY + offsetY;
    target.positions[pointIndex * 3 + 2] = position[2] * scaleZ + offsetZ;

    if (color && target.colors) {
      if (twoByteColor) {
        target.colors[pointIndex * 4] = color[0] / 256;
        target.colors[pointIndex * 4 + 1] = color[1] / 256;
        target.colors[pointIndex * 4 + 2] = color[2] / 256;
      } else {
        target.colors[pointIndex * 4] = color[0];
        target.colors[pointIndex * 4 + 1] = color[1];
        target.colors[pointIndex * 4 + 2] = color[2];
      }
      target.colors[pointIndex * 4 + 3] = 255;
    }

    target.intensities[pointIndex] = intensity;
    target.classifications[pointIndex] = classification;
  }
}

type PackedLASBoundingBox = [[number, number, number], [number, number, number]];

/**
 * Allocate an initially empty packed LAS bounding box accumulator.
 * @returns Mutable min/max bounds updated while point records are written.
 */
function createPackedLASBoundingBox(): PackedLASBoundingBox {
  return [
    [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
    [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY]
  ];
}

/**
 * Return stable bounds for packed output, including the empty-point fallback.
 * @param boundingBox Mutable min/max bounds accumulated during writes.
 * @param vertexCount Number of packed point rows.
 * @returns Final bounding box metadata.
 */
function finalizePackedLASBoundingBox(
  boundingBox: PackedLASBoundingBox,
  vertexCount: number
): [number[], number[]] {
  if (vertexCount === 0) {
    return [
      [0, 0, 0],
      [0, 0, 0]
    ];
  }
  return boundingBox;
}

/**
 * Write decoded LAS point records directly into an interleaved packed byte buffer.
 * @param decoder Decoded LAS point reader for the current chunk.
 * @param lasHeader LAS header with scale, offset, and color metadata.
 * @param options LAS loader options.
 * @param packedBytes Destination interleaved byte storage.
 * @param packedLayout Packed record byte layout.
 * @param pointOffset Destination point offset inside `packedBytes`.
 * @param boundingBox Mutable min/max bounds accumulator.
 */
function writePackedLASRecords(
  decoder: LASDecoder,
  lasHeader: LASHeader,
  options: LASLoaderOptions,
  packedBytes: Uint8Array,
  packedLayout: PackedMeshArrowLayout,
  pointOffset: number,
  boundingBox: PackedLASBoundingBox
): void {
  const batchSize = decoder.pointsCount;
  const dataView = new DataView(packedBytes.buffer, packedBytes.byteOffset, packedBytes.byteLength);
  const positionByteOffset = getRequiredPackedLASAttributeByteOffset(packedLayout, 'POSITION');
  const colorByteOffset = getPackedLASAttributeByteOffset(packedLayout, 'COLOR_0');
  const intensityByteOffset = getRequiredPackedLASAttributeByteOffset(packedLayout, 'intensity');
  const classificationByteOffset = getRequiredPackedLASAttributeByteOffset(
    packedLayout,
    'classification'
  );
  const {
    scale: [scaleX, scaleY, scaleZ],
    offset: [offsetX, offsetY, offsetZ]
  } = lasHeader;
  const twoByteColor = detectTwoByteColors(decoder, batchSize, options.las?.colorDepth);

  for (let chunkPointIndex = 0; chunkPointIndex < batchSize; chunkPointIndex++) {
    const {position, color, intensity, classification} = decoder.getPoint(chunkPointIndex);
    const packedPointIndex = pointOffset + chunkPointIndex;
    const recordByteOffset = packedPointIndex * packedLayout.byteStride;
    const positionX = position[0] * scaleX + offsetX;
    const positionY = position[1] * scaleY + offsetY;
    const positionZ = position[2] * scaleZ + offsetZ;
    const positionRecordByteOffset = recordByteOffset + positionByteOffset;

    dataView.setFloat32(positionRecordByteOffset, positionX, true);
    dataView.setFloat32(positionRecordByteOffset + 4, positionY, true);
    dataView.setFloat32(positionRecordByteOffset + 8, positionZ, true);
    updatePackedLASBoundingBox(boundingBox, positionX, positionY, positionZ);

    if (color && colorByteOffset !== undefined) {
      const colorRecordByteOffset = recordByteOffset + colorByteOffset;
      packedBytes[colorRecordByteOffset] = twoByteColor ? color[0] / 256 : color[0];
      packedBytes[colorRecordByteOffset + 1] = twoByteColor ? color[1] / 256 : color[1];
      packedBytes[colorRecordByteOffset + 2] = twoByteColor ? color[2] / 256 : color[2];
      packedBytes[colorRecordByteOffset + 3] = 255;
    }

    dataView.setUint16(recordByteOffset + intensityByteOffset, intensity, true);
    dataView.setUint8(recordByteOffset + classificationByteOffset, classification);
  }
}

/**
 * Resolve one packed LAS attribute offset from the layout metadata.
 * @param packedLayout Packed LAS layout.
 * @param attribute Packed LAS attribute name.
 * @returns Attribute byte offset, or undefined when the attribute is absent.
 */
function getPackedLASAttributeByteOffset(
  packedLayout: PackedMeshArrowLayout,
  attribute: string
): number | undefined {
  return packedLayout.attributes.find(layout => layout.attribute === attribute)?.byteOffset;
}

/**
 * Resolve one required packed LAS attribute offset from layout metadata.
 * @param packedLayout Packed LAS layout.
 * @param attribute Required packed LAS attribute name.
 * @returns Attribute byte offset.
 */
function getRequiredPackedLASAttributeByteOffset(
  packedLayout: PackedMeshArrowLayout,
  attribute: string
): number {
  const byteOffset = getPackedLASAttributeByteOffset(packedLayout, attribute);
  if (byteOffset === undefined) {
    throw new Error(`LASLoader: packed LAS layout is missing attribute "${attribute}"`);
  }
  return byteOffset;
}

/**
 * Extend packed LAS bounds with one decoded point position.
 * @param boundingBox Mutable min/max accumulator.
 * @param positionX Scaled X coordinate.
 * @param positionY Scaled Y coordinate.
 * @param positionZ Scaled Z coordinate.
 */
function updatePackedLASBoundingBox(
  boundingBox: PackedLASBoundingBox,
  positionX: number,
  positionY: number,
  positionZ: number
): void {
  boundingBox[0][0] = Math.min(boundingBox[0][0], positionX);
  boundingBox[0][1] = Math.min(boundingBox[0][1], positionY);
  boundingBox[0][2] = Math.min(boundingBox[0][2], positionZ);
  boundingBox[1][0] = Math.max(boundingBox[1][0], positionX);
  boundingBox[1][1] = Math.max(boundingBox[1][1], positionY);
  boundingBox[1][2] = Math.max(boundingBox[1][2], positionZ);
}

/**
 * parse laz data
 * @param rawData
 * @param skip
 * @param onParseData
 * @return parsed point cloud
 */
/* eslint-enable max-statements */
export function parseLASChunked(
  rawData: ArrayBuffer,
  skip: number | undefined,
  onParseData: any = {},
  batchSize: number = DEFAULT_BATCH_SIZE
): void {
  for (const {decoder, header} of parseLASChunkedIterator(rawData, skip, batchSize)) {
    onParseData(decoder, header);
  }
}

/**
 * Decode LAS/LAZ data into point chunks.
 * @param rawData Complete LAS/LAZ file data
 * @param skip Point skip factor
 * @param batchSize Number of returned points per chunk
 * @returns Iterable of decoded point chunks
 */
function* parseLASChunkedIterator(
  rawData: ArrayBuffer,
  skip: number | undefined,
  batchSize: number = DEFAULT_BATCH_SIZE
): Iterable<LASDecodedChunk> {
  const dataHandler = new LASFile(rawData);
  const pointSkip = skip ?? 1;

  try {
    // open data
    dataHandler.open();

    const header = dataHandler.getHeader();
    // start loading
    const Unpacker = dataHandler.getUnpacker();

    const totalToRead = Math.ceil(header.pointsCount / Math.max(1, pointSkip));
    header.totalToRead = totalToRead;
    let totalRead = 0;

    /* eslint-disable no-constant-condition */
    while (true) {
      const chunk: LASChunk = dataHandler.readData(batchSize, pointSkip);

      totalRead += chunk.count;

      header.totalRead = totalRead;

      const unpacker = new Unpacker(chunk.buffer, chunk.count, header);

      // surface unpacker and progress via call back
      // use unpacker.pointsCount and unpacker.getPoint(i) to handle data in app
      yield {decoder: unpacker as unknown as LASDecoder, header};

      if (!chunk.hasMoreData || totalRead >= totalToRead) {
        break;
      }
    }
  } catch (e) {
    throw e;
  } finally {
    dataHandler.close();
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

/**
 * @param decoder
 * @param batchSize
 * @param colorDepth
 * @returns boolean
 */
function detectTwoByteColors(
  decoder: any = {},
  batchSize: number,
  colorDepth?: number | string
): boolean {
  let twoByteColor = false;
  switch (colorDepth) {
    case 8:
      twoByteColor = false;
      break;
    case 16:
      twoByteColor = true;
      break;
    case 'auto':
      if (decoder.getPoint(0).color) {
        for (let i = 0; i < batchSize; i++) {
          const {color} = decoder.getPoint(i);
          // eslint-disable-next-line max-depth
          if (color[0] > 255 || color[1] > 255 || color[2] > 255) {
            twoByteColor = true;
          }
        }
      }
      break;
    default:
      // eslint-disable-next-line
      console.warn('las: illegal value for options.las.colorDepth');
      break;
  }
  return twoByteColor;
}
