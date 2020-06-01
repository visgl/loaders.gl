/* global Buffer */
import getPixels from 'get-pixels';
import util from 'util';
import assert from 'assert';

export async function parseImageNode(arrayBuffer, mimeType, options) {
  assert(mimeType, 'MIMEType is required to parse image under Node.js');

  // TODO - check if getPixels callback is asynchronous if provided with buffer input
  // if not, parseImage can be a sync function
  const getPixelsAsync = util.promisify(getPixels);

  const buffer = arrayBuffer instanceof Buffer ? arrayBuffer : Buffer.from(arrayBuffer);

  const ndarray = await getPixelsAsync(buffer, mimeType);

  const shape = [...ndarray.shape];
  const layers = ndarray.shape.length === 4 ? ndarray.shape.shift() : 1;

  // extract width/height etc
  return {
    shape,
    data: ndarray.data,
    width: ndarray.shape[0],
    height: ndarray.shape[1],
    components: ndarray.shape[2],
    layers
  };
}
