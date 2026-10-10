// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {Potree2Loader} from './potree2-loader-types';
import {parsePotree2Metadata} from './parsers/parse-potree2';
import type {Potree2Metadata} from './potree2-types';

const {preload: _preload, ...metadata} = Potree2Loader;

/** Parser-bearing metadata loader for the three-file Potree 2.0 format. */
export const Potree2LoaderWithParser = {
  ...metadata,
  parse: async (bytes: ArrayBuffer) => parsePotree2Metadata(new TextDecoder().decode(bytes)),
  parseTextSync: parsePotree2Metadata
} as const satisfies LoaderWithParser<Potree2Metadata>;
