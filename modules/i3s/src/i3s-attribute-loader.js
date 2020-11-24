import {parseI3STileAttribute} from './lib/parsers/parse-i3s-attribute';
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {LoaderObject} */
const I3SAttributeLoader = {
  id: 'i3s-attribute',
  name: 'I3S Attribute',
  version: VERSION,
  mimeTypes: ['application/binary'],
  parse,
  extensions: ['bin'],
  options: {},
  binary: true
};

async function parse(data, options) {
  data = parseI3STileAttribute(data, options);
  return data;
}

export default I3SAttributeLoader;
