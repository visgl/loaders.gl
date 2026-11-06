// SPDX-License-Identifier: MIT
import {CubeLUTLoader, type CubeLUTLoaderOptions} from './cube-lut-loader-types';
import {parseCubeLUT} from './lut/parse-lut';
const {preload: _preload, ...metadata} = CubeLUTLoader;
/** Parses a text color lookup table. */
function parseTextSync(text: string, options?: CubeLUTLoaderOptions) {
  return parseCubeLUT(text);
}
/** Parser-bearing color lookup table loader. */
export const CubeLUTLoaderWithParser = {
  ...metadata,
  parseTextSync,
  parseText: async (text: string, options?: CubeLUTLoaderOptions) => parseTextSync(text, options),
  parse: async (data: ArrayBuffer, options?: CubeLUTLoaderOptions) =>
    parseTextSync(new TextDecoder().decode(data), options),
  parseSync: (data: ArrayBuffer, options?: CubeLUTLoaderOptions) =>
    parseTextSync(new TextDecoder().decode(data), options)
} as const;
