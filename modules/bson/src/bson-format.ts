// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

export const BSONFormat = {
  name: 'BSON',
  id: 'bson',
  module: 'bson',
  extensions: ['bson'],
  mimeTypes: ['application/bson'],
  category: 'json',
  binary: true
} as const satisfies Format;
