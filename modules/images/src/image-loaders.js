import parseImage from './lib/parsers/parse-image';
import parseSVG from './lib/parsers/parse-svg';

import {isPng, isGif, isBmp, isJpeg} from './lib/binary-image-api/binary-image-parsers';

export const JPEGLoader = {
  id: 'jpeg',
  category: 'image',
  name: 'JPEG',
  extensions: ['jpg', 'jpeg'],
  mimeType: 'image/jpeg',
  test: arrayBuffer => isJpeg(new DataView(arrayBuffer)),
  parse: parseImage,
  // test: ,
  options: {}
};

export const PNGLoader = {
  id: 'png',
  category: 'image',
  name: 'PNG',
  extensions: ['png'],
  mimeType: 'image/png',
  test: arrayBuffer => isPng(new DataView(arrayBuffer)),
  parse: parseImage,
  // test: , - Add sniffer here
  options: {}
};

export const GIFLoader = {
  id: 'gif',
  category: 'image',
  name: 'GIF',
  extensions: ['gif'],
  mimeType: 'image/gif',
  test: arrayBuffer => isGif(new DataView(arrayBuffer)),
  parse: parseImage,
  options: {}
};

export const BMPLoader = {
  id: 'bmp',
  category: 'image',
  name: 'BMP',
  extensions: ['gif'],
  mimeType: 'image/gif',
  test: arrayBuffer => isBmp(new DataView(arrayBuffer)),
  parse: parseImage,
  options: {}
};

export const SVGLoader = {
  id: 'svg',
  name: 'SVG',
  extensions: ['svg'],
  mimeType: 'image/svg+xml',
  // test: , - Add sniffer here
  parse: parseSVG
};

export const ImageLoaders = [
  JPEGLoader,
  PNGLoader,
  GIFLoader,
  BMPLoader,
  // WEBPLoader,
  // ICOLoader,
  SVGLoader
];
