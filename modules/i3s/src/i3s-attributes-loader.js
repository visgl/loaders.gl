import {parseI3STileAttributes} from './lib/parsers/parse-i3s-attributes';
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {LoaderObject} */
const I3SAttributesLoader = {
  id: 'i3s-attributes',
  name: 'I3S Attributes',
  version: VERSION,
  mimeTypes: ['application/binary'],
  parse,
  extensions: ['bin'],
  options: {}
};

async function parse(data, attributeStorageInfo) {
  data = parseI3STileAttributes(data, attributeStorageInfo);
  return data;
}

export default I3SAttributesLoader;
