// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Tile3DLayer, type Tile3DLayerProps} from '@deck.gl/geo-layers';
import {
  I3SSource,
  isTileset3DSource,
  Tiles3DSource,
  Tileset3D,
  type Tileset3DProps,
  type Tileset3DSource
} from '@loaders.gl/tiles';
import {coreApi, preload, selectLoader} from '@loaders.gl/core';
import type {LoaderOptions, LoaderWithParser, RequestCredential} from '@loaders.gl/loader-utils';
import {createSLPKArchiveResolver, createTiles3DArchiveResolver} from './archive-source-resolver';

/**
 * Props for {@link Tile3DSourceLayer}.
 */
export type Tile3DSourceLayerProps<DataT = unknown> = Omit<Tile3DLayerProps<DataT>, 'data'> & {
  /** Root tileset URL or a pre-constructed tileset source. */
  data: string | Blob | Tileset3DSource;
};

/**
 * Internal deck.gl `Tile3DLayer` adapter that constructs source-backed `Tileset3D` instances.
 *
 * This class is exported for internal repository use and examples, and is not documented
 * beyond these TSDoc comments.
 */
export class Tile3DSourceLayer<
  DataT = any,
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtraProps extends {} = {}
> extends Tile3DLayer<DataT, Tile3DSourceLayerProps<DataT> & ExtraProps> {
  /** deck.gl layer name used in debugging output. */
  static layerName = 'Tile3DSourceLayer';

  /** Default props inherited from `Tile3DLayer`. */
  static defaultProps = Tile3DLayer.defaultProps as any;

  /**
   * Creates a source-backed 3D tile layer.
   * @param props Layer properties accepting URLs, blobs, and pre-constructed tileset sources
   */
  constructor(props: Tile3DSourceLayerProps<DataT> & ExtraProps) {
    super(props as Tile3DLayerProps<DataT> & ExtraProps);
  }

  /** Install source-backed loading hooks after the base layer initializes its state. */
  initializeState(): void {
    super.initializeState();
    (this as any)._loadTileset = this.loadSourceTileset.bind(this);
  }

  /**
   * Loads a tileset from either a URL or a pre-constructed tileset source.
   * @param data Tileset URL or fully constructed source.
   */
  private async loadSourceTileset(data: string | Blob | Tileset3DSource): Promise<void> {
    if (isTileset3DSource(data)) {
      data.coreApi ||= coreApi;
      const tileset3d = new Tileset3D(data, {
        onTileLoad: (this as any)._onTileLoad.bind(this),
        onTileUnload: (this as any)._onTileUnload.bind(this),
        onTileError: this.props.onTileError
      });

      this.setState({
        tileset3d,
        layerMap: {}
      });

      await tileset3d.tilesetInitializationPromise;
      (this as any)._updateTileset(this.state.activeViewports);
      this.props.onTilesetLoad?.(tileset3d);
      return;
    }

    const tilesetUrl = data;
    const {loadOptions = {}} = this.props;

    // TODO: deprecate `loader` in v9.0
    // Prefer the explicit loader array over Tile3DLayer's default `loader` prop.
    // @ts-ignore
    const loaders = this.props.loaders || this.props.loader;
    const loaderCandidates = (Array.isArray(loaders) ? loaders : [loaders]).filter(Boolean);
    const selectedLoader =
      (await selectLoader(tilesetUrl, loaderCandidates as any, {
        ...loadOptions,
        core: {
          ...loadOptions.core,
          ignoreRegisteredLoaders: true,
          nothrow: true
        }
      })) || loaderCandidates[0];
    if (!selectedLoader) {
      throw new Error('Tile3DSourceLayer requires a loader for URL or Blob inputs.');
    }
    const loader = await preload(
      selectedLoader,
      loadOptions,
      typeof tilesetUrl === 'string' ? tilesetUrl : undefined
    );

    const options: {loadOptions: LoaderOptions} & Partial<Tileset3DProps> = {
      loadOptions: {...loadOptions}
    };
    let actualTilesetUrl = tilesetUrl;

    if (typeof tilesetUrl === 'string' && loader.preload) {
      const preloadOptions = await loader.preload(tilesetUrl, loadOptions);
      if (preloadOptions.url) {
        actualTilesetUrl = preloadOptions.url;
      }

      const credentials = preloadOptions.credentials as readonly RequestCredential[] | undefined;
      if (credentials?.length) {
        options.loadOptions.core = {
          ...options.loadOptions.core,
          credentials: [...(options.loadOptions.core?.credentials || []), ...credentials]
        };
      } else if (preloadOptions.headers) {
        options.loadOptions.fetch = {
          ...options.loadOptions.fetch,
          headers: preloadOptions.headers
        };
      }
      Object.assign(options, preloadOptions);
    }

    const source = createSource(actualTilesetUrl, loader, options.loadOptions, coreApi);
    const tileset3d = new Tileset3D(source, {
      onTileLoad: (this as any)._onTileLoad.bind(this),
      onTileUnload: (this as any)._onTileUnload.bind(this),
      onTileError: this.props.onTileError,
      ...options
    });

    this.setState({
      tileset3d,
      layerMap: {}
    });

    await tileset3d.tilesetInitializationPromise;
    (this as any)._updateTileset(this.state.activeViewports);
    this.props.onTilesetLoad?.(tileset3d);
  }
}

/**
 * Creates the format-specific source for a deck.gl loader.
 * @param url Resolved root metadata URL.
 * @param loader Loader used by the deck.gl layer.
 * @param loadOptions Loader options forwarded to the source.
 * @returns A source implementation matching the loader format.
 */
export function createSource(
  url: string | Blob,
  loader: LoaderWithParser,
  loadOptions: LoaderOptions,
  injectedCoreApi = coreApi
): Tiles3DSource | I3SSource {
  const sourceLoader = getSourceLoader(loader);
  const lowerCaseUrl = typeof url === 'string' ? url.toLowerCase() : '';

  if (sourceLoader.id === 'slpk' || lowerCaseUrl.endsWith('.slpk')) {
    const archiveConfig =
      sourceLoader.id === 'slpk'
        ? createSLPKArchiveResolver(url)
        : createSLPKArchiveResolver(url, sourceLoader);
    return new I3SSource(
      {
        url,
        loader: archiveConfig.loader,
        basePath: url,
        resolver: archiveConfig.resolver,
        coreApi: injectedCoreApi
      },
      loadOptions
    );
  }

  if (sourceLoader.id === '3tz' || lowerCaseUrl.endsWith('.3tz')) {
    const archiveConfig =
      sourceLoader.id === '3tz'
        ? createTiles3DArchiveResolver(url)
        : createTiles3DArchiveResolver(url, sourceLoader);
    return new Tiles3DSource(
      {
        url,
        loader: archiveConfig.loader,
        basePath: url,
        resolver: archiveConfig.resolver,
        coreApi: injectedCoreApi
      },
      loadOptions
    );
  }

  if (sourceLoader.id === 'i3s') {
    return new I3SSource({url, loader: sourceLoader, coreApi: injectedCoreApi}, loadOptions);
  }

  return new Tiles3DSource({url, loader: sourceLoader, coreApi: injectedCoreApi}, loadOptions);
}

/** Removes the provider bootstrap hook before a resolved service loader is used for child tiles. */
function getSourceLoader(loader: LoaderWithParser): LoaderWithParser {
  if (loader.id !== 'cesium-ion') {
    return loader;
  }

  const loaderWithProviderHooks = loader as LoaderWithParser & {parseUrl?: unknown};
  const {parseUrl: _parseUrl, preload: _preload, ...sourceLoader} = loaderWithProviderHooks;
  return sourceLoader as LoaderWithParser;
}
