import {isBrowser, readFile, loadImage as browserLoadImage} from '@loaders.gl/core';
import parseImageNode from './parse-image-node';

export default function loadImage(url, options) {
  if (isBrowser) {
    return browserLoadImage(url, options);
  }
  return readFile(url, options).then(data => parseImageNode(data, options));
}
