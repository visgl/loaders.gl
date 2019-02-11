import {isBrowser, loadImage as loadImageBrowser} from '@loaders.gl/core';
import getPixels from 'get-pixels';
import util from 'util';

export function loadImage(url, options = {}) {
  if (isBrowser) {
    return loadImageBrowser(url, options);
  }

  return loadImageNode(url, options).then(ndarray => ({
    width: ndarray.shape[0],
    height: ndarray.shape[1],
    data: ndarray.data
  }));
}

// Resolves to an ndarray
export function loadImageNode(url, options) {
  const getPixelsAsync = util.promisify(getPixels);
  return getPixelsAsync(url);
}
