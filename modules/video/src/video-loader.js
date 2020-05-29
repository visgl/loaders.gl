// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
import parseVideo from './lib/parsers/parse-video';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const EXTENSIONS = ['mp4'];
const MIME_TYPES = ['video/mp4'];

// Loads a platform-specific image type that can be used as input data to WebGL textures

const VideoLoader = {
  id: 'video',
  name: 'Video',
  version: VERSION,
  mimeTypes: MIME_TYPES,
  extensions: EXTENSIONS,

  parseResponse: parseVideo,

  // test: arrayBuffer => Boolean(getBinaryImageMetadata(new DataView(arrayBuffer))),
  options: {
    video: {}
  }
};

export default VideoLoader;
