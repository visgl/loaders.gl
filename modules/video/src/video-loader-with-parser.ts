// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import parseVideo from './lib/parsers/parse-video';
import {VideoLoader as VideoLoaderMetadata} from './video-loader';

const {preload: _VideoLoaderPreload, ...VideoLoaderMetadataWithoutPreload} = VideoLoaderMetadata;

export type VideoLoaderOptions = LoaderOptions & {
  video: {};
};

/**
 * Loads a platform-specific image type that can be used as input data to WebGL textures
 */
export const VideoLoaderWithParser = {
  ...VideoLoaderMetadataWithoutPreload,
  parse: parseVideo
} as const satisfies LoaderWithParser<HTMLVideoElement, never, VideoLoaderOptions>;
