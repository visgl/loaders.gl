// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTFLoaderOptions} from '../../gltf-loader-types';
import type {GLTFWithBuffers} from '../types/gltf-types';
import type {GLTF_MSFT_texture_dds} from '../types/gltf-json-schema';
import type {Loader, LoaderContext} from '@loaders.gl/core/loader-utils';
import {GLTFIterator} from '../api/gltf-iterator';

/** Name of the Microsoft DDS texture extension. */
export const name = 'MSFT_texture_dds';

/** Finds a DDS-capable loader supplied through the parent loader context. */
export function getDDSLoader(context?: LoaderContext): Loader | undefined {
  return context?.loaders?.find(
    loader => loader.extensions?.includes('dds') || loader.mimeTypes?.includes('image/vnd-ms.dds')
  );
}

/** Select DDS sources only when an application supplies a compatible loader. */
export function preprocess(
  gltf: GLTFWithBuffers,
  _options: GLTFLoaderOptions,
  context?: LoaderContext
): void {
  const iterator = new GLTFIterator(gltf);
  if (!iterator.hasExtension(name)) return;
  if (!getDDSLoader(context)) {
    if (iterator.isExtensionRequired(name)) {
      throw new Error('gltf: Required extension MSFT_texture_dds needs a DDS parser');
    }
    return;
  }
  for (const texture of iterator.textures) {
    const extension = iterator.getExtension<GLTF_MSFT_texture_dds>(texture, name);
    if (extension) texture.source = extension.source;
  }
}

/** Remove DDS declarations only after image loading can identify the selected sources. */
export async function decode(
  gltf: GLTFWithBuffers,
  options: GLTFLoaderOptions,
  context?: LoaderContext
): Promise<void> {
  if (!getDDSLoader(context) || options.gltf?.loadImages === false) return;
  const iterator = new GLTFIterator(gltf);
  if (!iterator.hasExtension(name)) return;
  for (const texture of iterator.textures) iterator.removeExtension(texture, name);
  iterator.removeExtension(name);
}
