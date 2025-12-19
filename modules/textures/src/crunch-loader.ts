// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {TextureLevel} from '@loaders.gl/schema';
import {VERSION} from './lib/utils/version';

/** CrunchLoader options */
export type CrunchLoaderOptions = LoaderOptions & {
  /** CrunchLoader options */
  crunch?: {
    /** @deprecated Specify where to load the Crunch decoder library */
    libraryPath?: string;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * Worker loader for the Crunch compressed texture container format
 * @note We avoid bundling crunch - it is a rare format and large lib, so we only offer worker loader
 */
export const CrunchLoader = {
  dataType: null as unknown as TextureLevel[],
  batchType: null as never,

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
} as const satisfies Loader<TextureLevel[], never, CrunchLoaderOptions>;
