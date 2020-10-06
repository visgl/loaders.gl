/* global TextDecoder */
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

async function parseNodePage(data) {
  return JSON.parse(new TextDecoder().decode(data));
}

/** @type {LoaderObject} */
const I3SNodePageLoader = {
  id: 'i3s-node-page',
  name: 'I3S Node Page',
  version: VERSION,
  mimeTypes: ['application/json'],
  parse,
  extensions: ['json'],
  options: {}
};

async function parse(data) {
  data = parseNodePage(data);
  return data;
}

export default I3SNodePageLoader;
