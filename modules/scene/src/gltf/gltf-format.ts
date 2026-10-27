// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/core/loader-utils';

/** glTF scene format. */
export const GLTFFormat = {
  name: 'glTF',
  id: 'gltf',
  module: 'scene',
  encoding: 'binary',
  format: 'gltf',
  extensions: ['gltf', 'glb'],
  mimeTypes: ['model/gltf+json', 'model/gltf-binary'],
  text: true,
  binary: true,
  tests: ['glTF']
} as const satisfies Format;

/** Binary glTF container format. */
export const GLBFormat = {
  name: 'GLB',
  id: 'glb',
  module: 'scene',
  encoding: 'binary',
  format: 'glb',
  extensions: ['glb'],
  mimeTypes: ['model/gltf-binary'],
  binary: true,
  tests: ['glTF']
} as const satisfies Format;
