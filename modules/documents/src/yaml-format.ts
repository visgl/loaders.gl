// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/core/loader-utils';

/** YAML document format. */
export const YAMLFormat = {
  name: 'YAML',
  id: 'yaml',
  module: 'documents',
  format: 'yaml',
  extensions: ['yaml', 'yml'],
  mimeTypes: ['application/yaml', 'application/x-yaml', 'text/yaml'],
  category: 'table',
  text: true
} as const satisfies Format;
