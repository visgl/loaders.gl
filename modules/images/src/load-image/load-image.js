import {isBrowser, loadImage as loadImageBrowser} from '@loaders.gl/core';
import getPixels from 'get-pixels';
import {promisify} from 'util';

export function loadImage(url, options) {
  if (isBrowser) {
    return loadImageBrowser(url, options);
  }
  return loadImageNode(url, options);
}

function loadImageNode(url) {
  const getPixelsAsync = promisify(getPixels);
  return getPixelsAsync(url);
}
