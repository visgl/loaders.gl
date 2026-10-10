// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {
  PotreeLoader as PotreeLoaderMetadata,
  type PotreeDatasetMetadata,
  type POTreeLoaderOptions
} from './potree-loader-types';
import {PotreeMetadataSchema} from './types/potree-metadata';

import {parsePotree2Metadata} from './parsers/parse-potree2';

const {preload: _PotreeLoaderPreload, ...PotreeLoaderMetadataWithoutPreload} = PotreeLoaderMetadata;

/** Potree loader */
export const PotreeLoaderWithParser = {
  ...PotreeLoaderMetadataWithoutPreload,
  parse: async (data: ArrayBuffer) => parsePotreeMetadata(new TextDecoder().decode(data)),
  parseTextSync: parsePotreeMetadata
} as const satisfies LoaderWithParser<PotreeDatasetMetadata, never, POTreeLoaderOptions>;

/** Parses and validates a Potree cloud.js or metadata.json document. */
function parsePotreeMetadata(text: string): PotreeDatasetMetadata {
  const jsonText = text.replace(/^\uFEFF/, '').replace(/^(?:\s*\/\/[^\r\n]*(?:\r?\n|$))*/, '');
  const metadata = JSON.parse(jsonText);
  return metadata.version === '2.0'
    ? parsePotree2Metadata(jsonText)
    : PotreeMetadataSchema.parse(metadata);
}
