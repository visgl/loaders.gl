// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

export const PotreeFormat = {
  name: 'Potree',
  id: 'potree',
  module: 'potree',
  encoding: 'json',
  format: 'potree',
  extensions: ['js'],
  mimeTypes: ['application/json'],
  text: true
} as const satisfies Format;

export const PotreeBinFormat = {
  name: 'Potree Binary',
  id: 'potree-bin',
  module: 'potree',
  encoding: 'binary',
  format: 'potree-bin',
  extensions: ['bin'],
  mimeTypes: ['application/octet-stream'],
  binary: true
} as const satisfies Format;

export const PotreeHierarchyChunkFormat = {
  name: 'Potree Hierarchy Chunk',
  id: 'potree-hierarchy-chunk',
  module: 'potree',
  encoding: 'binary',
  format: 'potree-hierarchy-chunk',
  extensions: ['hrc'],
  mimeTypes: ['application/octet-stream'],
  binary: true
} as const satisfies Format;
