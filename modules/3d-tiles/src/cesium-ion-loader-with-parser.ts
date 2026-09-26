// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderContext, StrictLoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import {getAuthenticatedFetch, resolveAuthenticationOptions} from '@loaders.gl/loader-utils';
import {Tiles3DLoaderWithParser} from './tiles-3d-loader-with-parser';
import {getIonTilesetMetadata} from './lib/ion/ion';
import {CesiumIonLoader as CesiumIonLoaderMetadata} from './cesium-ion-loader';

const {preload: _CesiumIonLoaderPreload, ...CesiumIonLoaderMetadataWithoutPreload} =
  CesiumIonLoaderMetadata;

/** Resolves a Cesium ion asset before the parser requests its root tileset. */
async function preload(url: string, options: StrictLoaderOptions = {}) {
  const cesiumIonOptions = options['cesium-ion'] || {};
  const {accessToken, onError} = cesiumIonOptions;
  let {assetId} = cesiumIonOptions;
  if (!Number.isFinite(assetId)) {
    const matched = url.match(/\/([0-9]+)\/tileset.json/);
    assetId = matched && matched[1];
  }
  try {
    const fetchFunction = getAuthenticatedFetch(options);
    return await getIonTilesetMetadata(
      typeof accessToken === 'string' ? accessToken : null,
      typeof assetId === 'string' || typeof assetId === 'number' ? assetId : null,
      {fetch: fetchFunction}
    );
  } catch (error) {
    if (typeof onError === 'function') {
      onError(error);
    }
    throw error;
  }
}

/** Resolves, fetches, and parses a Cesium ion URL through the provider bootstrap flow. */
async function parseUrl(url: string, options: StrictLoaderOptions = {}, context?: LoaderContext) {
  options = resolveAuthenticationOptions(options);
  const metadata = await preload(url, options);
  const credentials = [...(options.core?.credentials || []), ...metadata.credentials];
  const fetchFunction = getAuthenticatedFetch({...options, core: {...options.core, credentials}});
  const response = await fetchFunction(metadata.url);
  if (!response.ok) {
    throw new Error(response.statusText || `Cesium ion asset request failed: ${response.status}`);
  }
  const resolvedURL = new URL(metadata.url);
  const parserOptions = {
    ...options,
    core: {...options.core, credentials},
    '3d-tiles': options['cesium-ion']
  };
  const loaderContext = {
    ...context,
    url: metadata.url,
    baseUrl: metadata.url.slice(0, metadata.url.lastIndexOf('/')),
    queryString: resolvedURL.search.slice(1),
    fetch: fetchFunction
  } as LoaderContext;
  return Tiles3DLoaderWithParser.parse(await response.arrayBuffer(), parserOptions, loaderContext);
}

/**
 * Loader for 3D tiles from Cesium ION
 */
export const CesiumIonLoaderWithParser = {
  ...CesiumIonLoaderMetadataWithoutPreload,
  preload,
  parseUrl,
  parse: async (data, options?, context?) => {
    options = {...options};
    options['3d-tiles'] = options['cesium-ion'];
    // @ts-ignore
    options.loader = CesiumIonLoaderWithParser;
    return Tiles3DLoaderWithParser.parse(data, options, context); // , loader);
  }
} as const satisfies LoaderWithParser<unknown, never, StrictLoaderOptions>;
