// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
/** Package version injected by the build. */
// @ts-ignore __VERSION__ is injected during compilation.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';
import type {VTKDataset, VTKXMLDataset} from './vtk';
/** Loads the existing VTK readers on demand. */
async function preload() {
  const {VTKLoaderWithParser} = await import('@loaders.gl/scientific/vtk-loader');
  return VTKLoaderWithParser;
}
/** Metadata-only loader for the supported legacy ASCII and XML VTK subsets. */
export const VTKLoader = {
  name: 'VTK',
  id: 'vtk',
  module: 'scientific',
  version: VERSION,
  extensions: ['vtk', 'vti', 'vtu', 'vtp', 'vtr', 'vts'],
  mimeTypes: ['application/vnd.vtk'],
  text: true,
  dataType: null as unknown as VTKDataset | VTKXMLDataset,
  batchType: null as never,
  options: {},
  preload
} as const;
