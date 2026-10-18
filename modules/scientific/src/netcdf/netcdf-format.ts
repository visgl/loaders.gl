// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

export const NetCDFFormat = {
  name: 'NetCDF',
  id: 'netcdf',
  module: 'netcdf',
  encoding: 'binary',
  format: 'netcdf',
  extensions: ['cdf', 'nc'],
  mimeTypes: ['application/x-netcdf'],
  binary: true
} as const satisfies Format;
