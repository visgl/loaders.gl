import {isBrowser} from '@loaders.gl/core';
import {encodeImageBrowser} from './write-image/encode-image-browser';
import {encodeImageToStreamNode} from './write-image/encode-image-node';

export default {
  name: 'Images',
  extensions: ['jpeg'],
  encode: isBrowser && encodeImageBrowser,
  encodeToStream: !isBrowser && encodeImageToStreamNode,
  DEFAULT_OPTIONS: {
    type: 'png'
  }
};
