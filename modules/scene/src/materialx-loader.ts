// loaders.gl
// SPDX-License-Identifier: MIT
import {MaterialXLoader} from './materialx-loader-types';
import {parseMaterialX} from './materialx/parse-materialx';

const {preload: _preload, ...metadata} = MaterialXLoader;

/** Parser-bearing loader for MaterialX XML, currently requiring DOMParser. */
export const MaterialXLoaderWithParser = {
  ...metadata,
  parse: async (data: ArrayBuffer) => parseMaterialX(new TextDecoder().decode(data)),
  parseSync: (data: ArrayBuffer) => parseMaterialX(new TextDecoder().decode(data)),
  parseText: async (text: string) => parseMaterialX(text),
  parseTextSync: parseMaterialX
} as const;
