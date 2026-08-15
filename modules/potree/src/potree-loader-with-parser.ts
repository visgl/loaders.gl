// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {PotreeLoader as PotreeLoaderMetadata} from './potree-loader';
import {PotreeMetadataSchema, type PotreeMetadata} from './types/potree-metadata';

const {preload: _PotreeLoaderPreload, ...PotreeLoaderMetadataWithoutPreload} = PotreeLoaderMetadata;

export type POTreeLoaderOptions = LoaderOptions & {
  potree?: {};
};

/** Potree loader */
export const PotreeLoaderWithParser = {
  ...PotreeLoaderMetadataWithoutPreload,
  parse: async (data: ArrayBuffer) => parsePotreeMetadata(new TextDecoder().decode(data)),
  parseTextSync: parsePotreeMetadata
} as const satisfies LoaderWithParser<PotreeMetadata, never, POTreeLoaderOptions>;

/** Parses and validates one Potree `cloud.js` metadata document. */
function parsePotreeMetadata(text: string): PotreeMetadata {
  return PotreeMetadataSchema.parse(JSON.parse(text));
}
