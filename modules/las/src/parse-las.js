// ported and es6-ified from https://github.com/verma/plasio/
import {LASFile} from './laslaz-decoder';

export default function loadLAS(arraybuffer, options = {}) {
  let pointIndex = 0;

  let positions;
  let colors;
  let intensities;
  let classifications;

  const {skip = 1, onProgress} = options;

  return parseLAS(arraybuffer, skip, (decoder, header, progress) => {

    if (!positions) {
      const total = header.vertexCount;

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
        progress
      });
    }

  }).then(header => ({
    header,
    drawMode: 0,  // GL.POINTS
    attributes: {
      POSITION: positions,
      COLOR_0: colors,
      INTENSITY: intensities,
      CLASSIFICATION: classifications
    }
  }));
}

/**
 * parse laz data
 * @param {Binary} data
 * @return {*} parsed point cloud
 */
export function parseLAS(rawData, skip, onParseData) {
  const dataHandler = new LASFile(rawData);
  return (
    dataHandler
      .open()
      // open data
      .then(() => {
        dataHandler.isOpen = true;
        return dataHandler;
      })
      // attch header
      .then(data => data.getHeader().then(header => [data, header]))
      // start loading
      .then(([data, header]) => {
        const Unpacker = data.getUnpacker();

        const totalToRead = Math.floor(header.pointsCount / Math.max(1, skip));
        header.vertexCount = totalToRead;
        let totalRead = 0;

        const reader = () =>
          data.readData(1000 * 100, 0, skip).then(chunk => {
            totalRead += chunk.count;
            const unpacker = new Unpacker(chunk.buffer, chunk.count, header);
            // surface unpacker and progress via call back
            // use unpacker.pointsCount and unpacker.getPoint(i) to handle data in app
            onParseData(unpacker, header, totalRead / totalToRead);

            if (chunk.hasMoreData && totalRead < totalToRead) {
              return reader();
            }

            header.totalRead = totalRead;
            header.versionAsString = chunk.versionAsString;
            header.isCompressed = chunk.isCompressed;
            return [chunk, header];
          });

        return reader();
      })
      // done loading, close file
      .then(([data, header]) => {
        return dataHandler.close().then(() => {
          dataHandler.isOpen = false;
          // trim the LASFile which we don't really want to pass to the user
          return header;
        });
      })
      // handle exceptions
      .catch(e => {
        // make sure the data is closed, if the data is open close and then fail
        if (dataHandler.isOpen) {
          return dataHandler.close().then(() => {
            dataHandler.isOpen = false;
            throw e;
          });
        }
        throw e;
      })
  );
}
