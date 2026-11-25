// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {parseVTKLegacy} from './vtk/vtk';
export {parseVTKXML} from './vtk/vtk-xml';
export type {
  VTKDataset,
  VTKDataArray,
  VTKXMLDataset,
  VTKXMLPiece,
  VTKXMLArray,
  VTKXMLNumericArray
} from './vtk-bundled';
