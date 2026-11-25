// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Shared metadata for NullLoader. */
export const NullLoaderMetadata = {
  dataType: null,
  batchType: null,
  name: 'Null loader',
  id: 'null',
  module: 'core',
  version: VERSION,
  mimeTypes: ['application/x.empty'] as string[],
  extensions: ['null'] as string[],
  tests: [() => false] as (() => boolean)[],
  options: {
    null: {}
  }
} as const;

/** Defers the NullLoader parser until first use. */
export const NullLoader = {
  ...NullLoaderMetadata,
  async preload() {
    const implementation = await import('./null-loader.js');
    return implementation.NullLoader;
  }
} as const;
