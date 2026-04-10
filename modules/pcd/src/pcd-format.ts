// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/**
 * PCD (Point Cloud Data) file format
 */
export const PCDFormat = {
  name: 'PCD (Point Cloud Data)',
  id: 'pcd',
  module: 'pcd',
  extensions: ['pcd'],
  mimeTypes: ['text/plain'],
  category: 'pointcloud',
  text: true,
  binary: true
} as const satisfies Format;
