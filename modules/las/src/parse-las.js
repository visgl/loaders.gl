// ported and es6-ified from https://github.com/verma/plasio/
import {LASFile} from './laslaz-decoder';

export default function loadLAS(arraybuffer, options = {}) {
  let pointIndex = 0;

  let positions;
  let colors;
  let intensities;
  let classifications;
  let originalHeader;

  const {skip = 1, onProgress} = options;

  parseLAS(arraybuffer, skip, (decoder, header) => {

    if (!originalHeader) {
      originalHeader = header;
      const total = header.totalToRead;

      positions = new Float32Array(total * 3);
      // laslaz-decoder.js `pointFormatReaders`
      colors = header.pointsFormatId >= 2 ? new Uint8ClampedArray(total * 4) : null;
      intensities = new Uint16Array(total);
      classifications = new Uint8Array(total);
    }

    const batchSize = decoder.pointsCount;
    const {scale: [scaleX, scaleY, scaleZ], offset: [offsetX, offsetY, offsetZ]} = header;

    for (let i = 0; i < batchSize; i++) {
      const {position, color, intensity, classification} = decoder.getPoint(i);

      positions[pointIndex * 3] = position[0] * scaleX + offsetX;
      positions[pointIndex * 3 + 1] = position[1] * scaleY + offsetY;
      positions[pointIndex * 3 + 2] = position[2] * scaleZ + offsetZ;

      if (color) {
        colors[pointIndex * 4] = color[0];
        colors[pointIndex * 4 + 1] = color[1];
        colors[pointIndex * 4 + 2] = color[2];
        colors[pointIndex * 4 + 3] = 255;
      }

      intensities[pointIndex] = intensity;
      classifications[pointIndex] = classification;

      pointIndex++;
    }

    if (onProgress) {
      onProgress({
        header,
        drawMode: 0,  // GL.POINTS
        attributes: {
          POSITION: positions,
          COLOR_0: colors,
          INTENSITY: intensities,
          CLASSIFICATION: classifications
        },
        progress: header.totalRead / header.totalToRead
      });
    }
  });

  return {
    originalHeader,
    header: {
      vertexCount: originalHeader.totalToRead
    },
    drawMode: 0,  // GL.POINTS
    attributes: {
      POSITION: positions,
      COLOR_0: colors,
      INTENSITY: intensities,
      CLASSIFICATION: classifications
    }
  };
}

/**
 * parse laz data
 * @param {Binary} data
 * @return {*} parsed point cloud
 */
export function parseLAS(rawData, skip, onParseData) {
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
      const chunk = dataHandler.readData(1000 * 100, 0, skip);

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
