/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
import {parseI3STileAttribute} from './lib/parsers/parse-i3s-attribute';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Loader for I3S attributes
 * @type {LoaderObject}
 */
export const I3SAttributeLoader = {
  name: 'I3S Attribute',
  id: 'i3s-attribute',
  module: 'i3s',
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
