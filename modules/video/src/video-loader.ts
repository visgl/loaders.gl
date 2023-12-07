// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import parseVideo from './lib/parsers/parse-video';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const EXTENSIONS = ['mp4'];
const MIME_TYPES = ['video/mp4'];

// Loads a platform-specific image type that can be used as input data to WebGL textures

export type VideoLoaderOptions = LoaderOptions & {
  video: {};
};

const DEFAULT_LOADER_OPTIONS: VideoLoaderOptions = {
  video: {}
};

export const VideoLoader: LoaderWithParser<HTMLVideoElement, never, VideoLoaderOptions> = {
  name: 'Video',
  id: 'video',
  module: 'video',
  version: VERSION,
  extensions: EXTENSIONS,
  mimeTypes: MIME_TYPES,

  parse: parseVideo,

  // tests: arrayBuffer => Boolean(getBinaryImageMetadata(new DataView(arrayBuffer))),
  options: DEFAULT_LOADER_OPTIONS
};
