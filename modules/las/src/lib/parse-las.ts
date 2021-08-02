// ported and es6-ified from https://github.com/verma/plasio/

import {Schema, getMeshBoundingBox} from '@loaders.gl/schema';
import type {LASLoaderOptions} from '../las-loader';
import type {LASMesh, LASHeader} from './las-types';
import {LASFile} from './laslaz-decoder';
import {getLASSchema} from './get-las-schema';

type LASChunk = {
  count: number;
  buffer: ArrayBuffer;
  hasMoreData: boolean;
  versionAsString?: string;
  isCompressed?: boolean;
};

/**
 * Parsing of .las file
 * @param arrayBuffer
 * @param options
 * @returns LASHeader
 */
/* eslint-disable max-statements */
export default function parseLAS(
  arrayBuffer: ArrayBuffer,
  options: LASLoaderOptions = {}
): LASMesh {
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
    schema: new Schema([]),
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

  // @ts-ignore Possibly undefined
  parseLASChunked(arrayBuffer, options.las?.skip, (decoder: any = {}, lasHeader: LASHeader) => {
    if (!originalHeader) {
      originalHeader = lasHeader;
      const total = lasHeader.totalToRead;

      const PositionsType = options.las?.fp64 ? Float64Array : Float32Array;
      positions = new PositionsType(total * 3);
      // laslaz-decoder.js `pointFormatReaders`
      colors = lasHeader.pointsFormatId >= 2 ? new Uint8Array(total * 4) : null;
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
 * parse laz data
 * @param rawData
 * @param skip
 * @param onParseData
 * @return parsed point cloud
 */
/* eslint-enable max-statements */
export function parseLASChunked(rawData: ArrayBuffer, skip: number, onParseData: any = {}): void {
  const dataHandler = new LASFile(rawData);

  try {
    // open data
    dataHandler.open();

    const header = dataHandler.getHeader();
    // start loading
    const Unpacker = dataHandler.getUnpacker();

    const totalToRead = Math.ceil(header.pointsCount / Math.max(1, skip));
    header.totalToRead = totalToRead;
    let totalRead = 0;

    /* eslint-disable no-constant-condition */
    while (true) {
      const chunk: LASChunk = dataHandler.readData(1000 * 100, 0, skip);

      totalRead += chunk.count;

      header.totalRead = totalRead;
      header.versionAsString = chunk.versionAsString;
      header.isCompressed = chunk.isCompressed;

      const unpacker = new Unpacker(chunk.buffer, chunk.count, header);

      // surface unpacker and progress via call back
      // use unpacker.pointsCount and unpacker.getPoint(i) to handle data in app
      onParseData(unpacker, header);

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
