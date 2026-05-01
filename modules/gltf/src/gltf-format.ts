// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/** glTF scene format. */
export const GLTFFormat = {
  name: 'glTF',
  id: 'gltf',
  module: 'gltf',
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
  module: 'gltf',
  encoding: 'binary',
  format: 'glb',
  extensions: ['glb'],
  mimeTypes: ['model/gltf-binary'],
  binary: true,
  tests: ['glTF']
} as const satisfies Format;
