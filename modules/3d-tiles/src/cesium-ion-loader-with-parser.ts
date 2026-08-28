// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {
  FetchLike,
  LoaderContext,
  StrictLoaderOptions,
  LoaderWithParser
} from '@loaders.gl/loader-utils';
import {createAuthenticatedFetch} from '@loaders.gl/loader-utils';
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
    const fetchFunction = createAuthenticatedFetch({
      fetch: getBaseFetch(options),
      credentials: options.core?.credentials || []
    });
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

/** Resolves Cesium ion's custom fetch function or static request defaults. */
function getBaseFetch(options: StrictLoaderOptions): FetchLike {
  const fetchOption = (options.fetch ?? options.core?.fetch) as
    | FetchLike
    | RequestInit
    | null
    | undefined;
  if (typeof fetchOption === 'function') return fetchOption;
  if (fetchOption) {
    return (url, requestOptions) => {
      const headers = new Headers(fetchOption.headers);
      new Headers(requestOptions?.headers).forEach((value, key) => headers.set(key, value));
      return fetch(url, {...fetchOption, ...requestOptions, headers});
    };
  }
  return (url, requestOptions) => fetch(url, requestOptions);
}

/** Resolves, fetches, and parses a Cesium ion URL through the provider bootstrap flow. */
async function parseUrl(url: string, options: StrictLoaderOptions = {}, context?: LoaderContext) {
  const metadata = await preload(url, options);
  const credentials = [...(options.core?.credentials || []), ...metadata.credentials];
  const fetchFunction = createAuthenticatedFetch({fetch: getBaseFetch(options), credentials});
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
