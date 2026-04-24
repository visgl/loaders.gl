// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type VideoLoaderOptions = LoaderOptions & {
  video: {};
};

/** Preloads the parser-bearing video loader implementation. */
async function preload() {
  const {VideoLoaderWithParser} = await import('./video-loader-with-parser');
  return VideoLoaderWithParser;
}

/** Metadata-only loader for platform-specific video elements. */
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
  preload
} as const satisfies Loader<HTMLVideoElement, never, VideoLoaderOptions>;
