// loaders.gl
// SPDX-License-Identifier: MIT
import {STLLoader} from './stl-loader-types';
import {parseSTL} from './stl/parse-stl';
const {preload: _preload, ...metadata} = STLLoader;
/** Parser-bearing STL loader returning renderer-independent triangle meshes. */
export const STLLoaderWithParser = {
  ...metadata,
  parse: async (data: ArrayBuffer) => parseSTL(data),
  parseSync: parseSTL
} as const;
