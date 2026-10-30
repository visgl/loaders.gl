// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/core/loader-utils';

/** Markdown text document format. */
export const MarkdownFormat = {
  name: 'Markdown',
  id: 'markdown',
  module: 'documents',
  extensions: ['md', 'markdown'],
  mimeTypes: ['text/markdown'],
  encoding: 'text',
  category: 'document',
  text: true
} as const satisfies Format;
