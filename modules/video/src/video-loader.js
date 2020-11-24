import parseVideo from './lib/parsers/parse-video';
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const EXTENSIONS = ['mp4'];
const MIME_TYPES = ['video/mp4'];

// Loads a platform-specific image type that can be used as input data to WebGL textures

/** @type {LoaderObject} */
const VideoLoader = {
  id: 'video',
  name: 'Video',
  version: VERSION,
  extensions: EXTENSIONS,
  mimeTypes: MIME_TYPES,

  parse: parseVideo,

  // tests: arrayBuffer => Boolean(getBinaryImageMetadata(new DataView(arrayBuffer))),
  options: {
    video: {}
  }
};

export default VideoLoader;
