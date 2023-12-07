// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import getPixels from 'get-pixels';

/** Declares which image format mime types this loader polyfill supports */
export const NODE_FORMAT_SUPPORT = ['image/png', 'image/jpeg', 'image/gif'];

// Note: These types are also defined in @loaders.gl/images and need to be kept in sync
type NDArray = {
  shape: number[];
  data: Uint8Array;
  width: number;
  height: number;
  components: number;
  layers: number[];
};

export async function parseImageNode(arrayBuffer: ArrayBuffer, mimeType: string): Promise<NDArray> {
  if (!mimeType) {
    throw new Error('MIMEType is required to parse image under Node.js');
  }

  const buffer = arrayBuffer instanceof Buffer ? arrayBuffer : Buffer.from(arrayBuffer);
  const ndarray = await getPixelsAsync(buffer, mimeType);
  return ndarray;
}

// TODO - check if getPixels callback is asynchronous if provided with buffer input
// if not, parseImage can be a sync function
function getPixelsAsync(buffer: Buffer, mimeType: string): Promise<NDArray> {
  return new Promise<NDArray>((resolve) =>
    getPixels(buffer, mimeType, (err, ndarray) => {
      if (err) {
        throw err;
      }

      const shape = [...ndarray.shape];
      const layers = ndarray.shape.length === 4 ? ndarray.shape.shift() : 1;
      const data = ndarray.data instanceof Buffer ? new Uint8Array(ndarray.data) : ndarray.data;

      // extract width/height etc
      resolve({
        shape,
        data,
        width: ndarray.shape[0],
        height: ndarray.shape[1],
        components: ndarray.shape[2],
        // TODO - error
        layers: layers ? [layers] : []
      });
    })
  );
}
