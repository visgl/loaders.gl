import {parseImage} from './lib/parsers/parse-image';
import {parseSVG} from './lib/parsers/parse-svg';

export const JPEGLoader = {
  id: 'jpeg',
  category: 'image',
  name: 'JPEG',
  extensions: ['jpg', 'jpeg'],
  mimeType: 'image/jpeg',
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
  parse: parseImage,
  options: {}
};

export const BMPLoader = {
  id: 'bmp',
  category: 'image',
  name: 'BMP',
  extensions: ['gif'],
  mimeType: 'image/gif',
  // test: , - Add sniffer here
  parse: parseImage,
  options: {}
};

export const SVGLoader = {
  id: 'svg',
  name: 'SVG',
  extensions: ['svg'],
  mimeType: 'image/svg+xml',
  parse: parseSVG
  // test: , - Add sniffer here
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
