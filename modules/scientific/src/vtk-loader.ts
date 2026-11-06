// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {VTKLoader} from './vtk-loader-types';
import {parseVTKLegacy, parseVTKXML} from './vtk';
const {preload: _preload, ...metadata} = VTKLoader;
/** Selects the existing VTK parser without changing its dataset representation. */
function parseTextSync(text: string) {
  const source = text.trimStart();
  if (source.startsWith('<')) return parseVTKXML(source);
  return parseVTKLegacy(source);
}
/** Parser-bearing VTK loader retaining scientific topology and attribute associations. */
export const VTKLoaderWithParser = {
  ...metadata,
  parseTextSync,
  parseText: async (text: string) => parseTextSync(text),
  parseSync: (data: ArrayBuffer) => parseTextSync(new TextDecoder().decode(data)),
  parse: async (data: ArrayBuffer) => parseTextSync(new TextDecoder().decode(data))
} as const;
