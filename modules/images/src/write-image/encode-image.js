import {isBrowser} from '@loaders.gl/core';
import {encodeImageNode} from './encode-image-node';
import {encodeImageBrowser} from './encode-image-browser';

export function encodeImage(image, options) {
  return isBrowser ? encodeImageBrowser(image, options) : encodeImageNode(image, options);
}
