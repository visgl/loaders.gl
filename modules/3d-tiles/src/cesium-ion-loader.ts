// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Loader, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import {Tiles3DLoader} from './tiles-3d-loader';

/**
 * Metadata for the 3D tiles from Cesium ION loader.
 * @deprecated Use `Tiles3DLoader` with `createCesiumIonCredential()` from
 * `@loaders.gl/services` in `loadOptions.core.credentials`.
 */
export const CesiumIonLoader = {
  ...Tiles3DLoader,
  id: 'cesium-ion',
  name: 'Cesium Ion',
  /** Loads the parser-bearing Cesium ion loader implementation. */
  preload: async () =>
    (await import('@loaders.gl/3d-tiles/cesium-ion-loader-with-parser')).CesiumIonLoaderWithParser,
  options: {
    'cesium-ion': {
      ...Tiles3DLoader.options['3d-tiles'],
      accessToken: null,
      assetId: null,
      onError: null
    }
  }
} as const satisfies Loader<unknown, never, StrictLoaderOptions>;
