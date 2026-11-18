// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {IESLoader} from './ies-loader-types';
import {parseIES} from './ies/parse-ies';
const {preload: _preload, ...metadata} = IESLoader;
/** Parser-bearing IES loader returning measured angles and intensities. */
export const IESLoaderWithParser = {
  ...metadata,
  parseTextSync: parseIES,
  parseText: async (text: string) => parseIES(text),
  parseSync: (data: ArrayBuffer) => parseIES(new TextDecoder().decode(data)),
  parse: async (data: ArrayBuffer) => parseIES(new TextDecoder().decode(data))
} as const;
