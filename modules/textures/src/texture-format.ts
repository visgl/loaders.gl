// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

export const BasisTextureFormat = {
  name: 'Basis',
  id: 'basis',
  module: 'textures',
  encoding: 'image',
  format: 'basis',
  extensions: ['basis', 'ktx2'],
  mimeTypes: ['application/octet-stream', 'image/ktx2'],
  binary: true,
  tests: ['sB']
} as const satisfies Format;

export const CompressedTextureFormat = {
  name: 'Texture Containers',
  id: 'compressed-texture',
  module: 'textures',
  encoding: 'image',
  format: 'compressed-texture',
  extensions: ['ktx', 'ktx2', 'dds', 'pvr'],
  mimeTypes: [
    'image/ktx2',
    'image/ktx',
    'image/vnd-ms.dds',
    'image/x-dds',
    'application/octet-stream'
  ],
  binary: true
} as const satisfies Format;

export const NPYFormat = {
  name: 'NPY',
  id: 'npy',
  module: 'textures',
  encoding: 'binary',
  format: 'npy',
  extensions: ['npy'],
  mimeTypes: [],
  binary: true
} as const satisfies Format;

export const RadianceHDRFormat = {
  name: 'Radiance HDR',
  id: 'hdr',
  module: 'textures',
  encoding: 'image',
  format: 'radiance-hdr',
  extensions: ['hdr'],
  mimeTypes: ['image/vnd.radiance', 'image/x-hdr', 'application/octet-stream'],
  binary: true
} as const satisfies Format;

export const CrunchTextureFormat = {
  id: 'crunch',
  name: 'Crunch',
  module: 'textures',
  encoding: 'image',
  format: 'crunch',
  extensions: ['crn'],
  mimeTypes: ['image/crn', 'image/x-crn', 'application/octet-stream'],
  binary: true
} as const satisfies Format;

export const KTX2BasisTextureFormat = {
  name: 'Basis Universal Supercompressed GPU Texture',
  id: 'ktx2-basis-writer',
  module: 'textures',
  encoding: 'image',
  format: 'ktx2',
  extensions: ['ktx2'],
  mimeTypes: ['image/ktx2'],
  binary: true
} as const satisfies Format;

export const DDSTextureFormat = {
  name: 'DDS Texture Container',
  id: 'dds',
  module: 'textures',
  encoding: 'image',
  format: 'dds',
  extensions: ['dds'],
  mimeTypes: ['image/vnd-ms.dds', 'image/x-dds', 'application/octet-stream'],
  binary: true
} as const satisfies Format;
