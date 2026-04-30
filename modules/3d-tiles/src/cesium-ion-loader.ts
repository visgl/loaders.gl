// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Loader, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import {Tiles3DLoader} from './tiles-3d-loader';

/**
 * Metadata for the 3D tiles from Cesium ION loader.
 */
export const CesiumIonLoader = {
  ...Tiles3DLoader,
  id: 'cesium-ion',
  name: 'Cesium Ion',
  options: {
    'cesium-ion': {
      ...Tiles3DLoader.options['3d-tiles'],
      accessToken: null,
      onError: null
    }
  }
} as const satisfies Loader<unknown, never, StrictLoaderOptions>;
