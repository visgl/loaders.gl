// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/** Video media format. */
export const VideoFormat = {
  name: 'Video',
  id: 'video',
  module: 'video',
  encoding: 'video',
  format: 'video',
  extensions: ['mp4'],
  mimeTypes: ['video/mp4'],
  category: 'video',
  binary: true
} as const satisfies Format;
