// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

export const GeoPackageFormat = {
  id: 'geopackage',
  name: 'GeoPackage',
  module: 'geopackage',
  extensions: ['gpkg'],
  mimeTypes: ['application/geopackage+sqlite3'],
  category: 'geometry'
} as const satisfies Format;
