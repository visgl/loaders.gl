// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {ThreeDLLUTLoader, type ThreeDLLUTLoaderOptions} from './3dl-lut-loader-types';
import {parse3DLLUT} from './lut/parse-lut';
const {preload: _preload, ...metadata} = ThreeDLLUTLoader;
/** Parses a text color lookup table. */
function parseTextSync(text: string, options?: ThreeDLLUTLoaderOptions) {
  return parse3DLLUT(text, options?.lut?.outputBitDepth ?? 0);
}
/** Parser-bearing color lookup table loader. */
export const ThreeDLLUTLoaderWithParser = {
  ...metadata,
  parseTextSync,
  parseText: async (text: string, options?: ThreeDLLUTLoaderOptions) =>
    parseTextSync(text, options),
  parse: async (data: ArrayBuffer, options?: ThreeDLLUTLoaderOptions) =>
    parseTextSync(new TextDecoder().decode(data), options),
  parseSync: (data: ArrayBuffer, options?: ThreeDLLUTLoaderOptions) =>
    parseTextSync(new TextDecoder().decode(data), options)
} as const;
