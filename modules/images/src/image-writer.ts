// loaders.gl, MIT license

import type {Writer, WriterOptions} from '@loaders.gl/loader-utils';
import type {ImageDataType} from './types';
import {VERSION} from './lib/utils/version';
import {encodeImage} from './lib/encoders/encode-image';

export type ImageWriterOptions = WriterOptions & {
  image?: {
    mimeType?: 'image/png';
    jpegQuality?: number | null;
  };
};

/** Writer for image data */
export const ImageWriter: Writer<ImageDataType, never, ImageWriterOptions> = {
  name: 'Images',
  id: 'image',
  module: 'images',
  version: VERSION,
  extensions: ['jpeg'],
  options: {
    image: {
      mimeType: 'image/png',
      jpegQuality: null
    }
  },
  encode: encodeImage
};
