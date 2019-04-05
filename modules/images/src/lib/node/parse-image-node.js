/* global Buffer */
import getPixels from 'get-pixels';
import util from 'util';
import {getImageMetadata} from '../get-image-metadata';

export async function parseImageNode(arrayBuffer, options) {
  // TODO - check if getPixels callback is asynchronous if provided with buffer input
  // if not, parseImage can be a sync function
  const getPixelsAsync = util.promisify(getPixels);

  const {mimeType} = getImageMetadata(arrayBuffer);
  const buffer = arrayBuffer instanceof Buffer ? arrayBuffer : Buffer.from(arrayBuffer);

  const ndarray = await getPixelsAsync(buffer, mimeType);
  return {
    width: ndarray.shape[0],
    height: ndarray.shape[1],
    data: ndarray.data
  };
}
