// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {StrictLoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import {Tiles3DLoaderWithParser} from './tiles-3d-loader-with-parser';
import {getIonTilesetMetadata} from './lib/ion/ion';
import {CesiumIonLoader as CesiumIonLoaderMetadata} from './cesium-ion-loader';

const {preload: _CesiumIonLoaderPreload, ...CesiumIonLoaderMetadataWithoutPreload} =
  CesiumIonLoaderMetadata;

async function preload(url, options = {}) {
  options = options['cesium-ion'] || {};
  // @ts-ignore
  const {accessToken, onError} = options;
  // @ts-ignore
  let assetId = options.assetId;
  if (!Number.isFinite(assetId)) {
    const matched = url.match(/\/([0-9]+)\/tileset.json/);
    assetId = matched && matched[1];
  }
  try {
    return await getIonTilesetMetadata(accessToken, assetId);
  } catch (error) {
    if (typeof onError === 'function') {
      onError(error);
    }
    throw error;
  }
}

/**
 * Loader for 3D tiles from Cesium ION
 */
export const CesiumIonLoaderWithParser = {
  ...CesiumIonLoaderMetadataWithoutPreload,
  preload,
  parse: async (data, options?, context?) => {
    options = {...options};
    options['3d-tiles'] = options['cesium-ion'];
    // @ts-ignore
    options.loader = CesiumIonLoaderWithParser;
    return Tiles3DLoaderWithParser.parse(data, options, context); // , loader);
  }
} as const satisfies LoaderWithParser<unknown, never, StrictLoaderOptions>;
