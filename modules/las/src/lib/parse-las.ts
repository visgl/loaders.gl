// ported and es6-ified from https://github.com/verma/plasio/

import type {LASHeader, LASLoaderOptions} from '../las-loader';
import {getMeshBoundingBox} from '@loaders.gl/loader-utils';
import {LASFile} from './laslaz-decoder';

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
export default function parseLAS(arrayBuffer: ArrayBuffer, options: LASLoaderOptions): LASHeader {
  let pointIndex: number = 0;

  let positions: Float32Array | Float64Array;
  let colors: Uint8Array | null;
  let intensities: Uint16Array;
  let classifications: Uint8Array;
  let originalHeader: any;

  const result: any = {};
  const {onProgress} = options;

  const {skip, colorDepth, fp64} = options.las || {};

  parseLASChunked(arrayBuffer, skip, (decoder: any = {}, header: LASHeader) => {
    if (!originalHeader) {
      originalHeader = header;
      const total = header.totalToRead;

      const PositionsType = fp64 ? Float64Array : Float32Array;
      positions = new PositionsType(total * 3);
      // laslaz-decoder.js `pointFormatReaders`
      colors = header.pointsFormatId >= 2 ? new Uint8Array(total * 4) : null;
      intensities = new Uint16Array(total);
      classifications = new Uint8Array(total);

      Object.assign(result, {
        loaderData: {header},
        mode: 0, // GL.POINTS
        attributes: {
          POSITION: {value: positions, size: 3},
          // non-gltf attributes, use non-capitalized names for now
          intensity: {value: intensities, size: 1},
          classification: {value: classifications, size: 1}
        }
      });

      if (colors) {
        result.attributes.COLOR_0 = {value: colors, size: 4};
      }
    }

    const batchSize = decoder.pointsCount;
    const {
      scale: [scaleX, scaleY, scaleZ],
      offset: [offsetX, offsetY, offsetZ]
    } = header;

    const twoByteColor = detectTwoByteColors(decoder, batchSize, colorDepth);

    for (let i = 0; i < batchSize; i++) {
      const {position, color, intensity, classification} = decoder.getPoint(i);

      positions[pointIndex * 3] = position[0] * scaleX + offsetX;
      positions[pointIndex * 3 + 1] = position[1] * scaleY + offsetY;
      positions[pointIndex * 3 + 2] = position[2] * scaleZ + offsetZ;

      if (color && colors !== null) {
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

    if (onProgress) {
      onProgress(
        Object.assign(
          {
            header: {
              vertexCount: header.totalRead
            },
            progress: header.totalRead / header.totalToRead
          },
          result
        )
      );
    }
  });

  result.header = {
    vertexCount: originalHeader.totalToRead,
    boundingBox: getMeshBoundingBox(result.attributes)
  };
  return result as LASHeader;
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
