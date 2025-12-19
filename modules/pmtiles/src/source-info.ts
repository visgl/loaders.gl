// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Schema} from '@loaders.gl/schema';

export type SourceInfo = VectorSourceInfo | ImageSourceInfo;

/** Information about a vector source */
export type VectorSourceInfo = {
  shape: 'vector-source';
  /** List of geospatial tables */
  layers: {name: string; schema: Schema}[];
  /** List of nongeospatial tables */
  tables: {name: string; schema: Schema}[];
  /** Format specific metadata */
  formatSpecificMetadata?: Record<string, any>;
};

/** Information about an image source */
export type ImageSourceInfo = {
  shape: 'image-source';
  /** Format specific metadata */
  formatSpecificMetadata?: Record<string, any>;
};
