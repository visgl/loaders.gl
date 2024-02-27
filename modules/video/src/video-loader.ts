// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import parseVideo from './lib/parsers/parse-video';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type VideoLoaderOptions = LoaderOptions & {
  video: {};
};

/**
 * Loads a platform-specific image type that can be used as input data to WebGL textures
 */
export const VideoLoader = {
  dataType: null as unknown as HTMLVideoElement,
  batchType: null as never,
  name: 'Video',
  id: 'video',
  module: 'video',
  version: VERSION,
  extensions: ['mp4'],
  mimeTypes: ['video/mp4'],
  // tests: arrayBuffer => Boolean(getBinaryImageMetadata(new DataView(arrayBuffer))),
  options: {
    video: {}
  },
  parse: parseVideo
} as const satisfies LoaderWithParser<HTMLVideoElement, never, VideoLoaderOptions>;
