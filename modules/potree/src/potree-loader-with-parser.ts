// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {PotreeLoader as PotreeLoaderMetadata} from './potree-loader';

const {preload: _PotreeLoaderPreload, ...PotreeLoaderMetadataWithoutPreload} = PotreeLoaderMetadata;

export type POTreeLoaderOptions = LoaderOptions & {
  potree?: {};
};

/** Potree loader */
export const PotreeLoaderWithParser = {
  ...PotreeLoaderMetadataWithoutPreload,
  parse: (data: ArrayBuffer) => JSON.parse(new TextDecoder().decode(data)),
  parseTextSync: text => JSON.parse(text)
} as const satisfies LoaderWithParser<any, never, POTreeLoaderOptions>;
