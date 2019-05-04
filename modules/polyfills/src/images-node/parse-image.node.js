/* global Buffer */
import getPixels from 'get-pixels';
import util from 'util';

export async function parseImageNode(arrayBuffer, mimeType, options) {
  // TODO - check if getPixels callback is asynchronous if provided with buffer input
  // if not, parseImage can be a sync function
  const getPixelsAsync = util.promisify(getPixels);

  const buffer = arrayBuffer instanceof Buffer ? arrayBuffer : Buffer.from(arrayBuffer);

  const ndarray = await getPixelsAsync(buffer, mimeType);
  return {
    width: ndarray.shape[0],
    height: ndarray.shape[1],
    data: ndarray.data
  };
}
