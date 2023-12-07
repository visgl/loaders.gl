// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {TextureLevel} from '@loaders.gl/schema';
import {VERSION} from './lib/utils/version';

export type CrunchLoaderOptions = LoaderOptions & {
  crunch?: {
    libraryPath?: string;
  };
};

/**
 * Worker loader for the Crunch compressed texture container format
 * @note We avoid bundling crunch - it is a rare format and large lib, so we only offer worker loader
 */
export const CrunchLoader: Loader<TextureLevel[], never, CrunchLoaderOptions> = {
  id: 'crunch',
  name: 'Crunch',
  module: 'textures',
  version: VERSION,
  worker: true,
  extensions: ['crn'],
  mimeTypes: ['image/crn', 'image/x-crn', 'application/octet-stream'],
  binary: true,
  options: {
    crunch: {
      libraryPath: 'libs/'
    }
  }
};
