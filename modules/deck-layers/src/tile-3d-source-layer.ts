// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {UpdateParameters} from '@deck.gl/core';
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
import {
  getAuthenticatedFetch,
  type LoaderOptions,
  type LoaderWithParser,
  type RequestCredential
} from '@loaders.gl/loader-utils';
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
    // deck.gl creates a new layer instance on every render, while transferring the old state.
    // Install the adapter on every instance so data-source changes cannot fall back to the base
    // layer's legacy parsed-JSON loading path.
    (this as any)._loadTileset = this.loadSourceTileset.bind(this);
  }

  /** Initialize the underlying deck.gl tile layer state. */
  initializeState(): void {
    super.initializeState();
  }

  /**
   * Updates layer state and retries the initial traversal from the live deck.gl layer instance.
   * @param parameters deck.gl layer update parameters.
   */
  updateState(parameters: UpdateParameters<this>): void {
    super.updateState(parameters);

    // A source can finish initializing after deck.gl has transferred state to a newer layer
    // instance. The async instance cannot schedule work on the current layer, so retry from the
    // next live update until the first selection records a frame number.
    if (this.state.tileset3d && this.state.frameNumber === undefined) {
      this.updateLoadedTileset();
    }
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
        onTileError: this.props.onTileError,
        onUpdate: () => this.setNeedsUpdate()
      });

      this.setState({
        tileset3d,
        layerMap: {}
      });

      await tileset3d.tilesetInitializationPromise;
      this.updateLoadedTileset();
      this.props.onTilesetLoad?.(tileset3d);
      return;
    }

    const tilesetUrl = data;
    const {loadOptions = {}} = this.props;

    // `Tile3DLayer` supplies a default singular 3D Tiles loader. Prefer an explicitly
    // provided list so callers can use `loaders: [I3SLoader]` as a format hint.
    // TODO: deprecate `loader` in v9.0
    // Prefer the explicit loader array over Tile3DLayer's default `loader` prop.
    // @ts-ignore
    const loaders = this.props.loaders?.length ? this.props.loaders : this.props.loader;
    const loaderCandidates = (Array.isArray(loaders) ? loaders : [loaders]).filter(Boolean);
    const selectedLoader =
      inferTilesetLoader(tilesetUrl, loaderCandidates as LoaderWithParser[]) ||
      (await selectLoader(tilesetUrl, loaderCandidates as any, {
        ...loadOptions,
        core: {
          ...loadOptions.core,
          ignoreRegisteredLoaders: true,
          nothrow: true
        }
      })) ||
      loaderCandidates[0];
    if (!selectedLoader) {
      throw new Error('Tile3DSourceLayer requires a loader for URL or Blob inputs.');
    }
    const loader = await preload(
      selectedLoader,
      loadOptions,
      typeof tilesetUrl === 'string' ? tilesetUrl : undefined
    );

    const {tileset: tilesetOptions, ...remainingLoadOptions} = loadOptions as LoaderOptions & {
      tileset?: Partial<Tileset3DProps>;
    };
    const options: {loadOptions: LoaderOptions} & Partial<Tileset3DProps> = {
      loadOptions: {...remainingLoadOptions},
      ...tilesetOptions
    };
    let actualTilesetUrl = tilesetUrl;

    if (typeof tilesetUrl === 'string' && loader.preload) {
      const preloadOptions = await loader.preload(tilesetUrl, loadOptions);
      if (preloadOptions.url) {
        actualTilesetUrl = preloadOptions.url;
      }

      const credentials = preloadOptions.credentials as readonly RequestCredential[] | undefined;
      if (credentials?.length) {
        const combinedCredentials = [
          ...(options.loadOptions.core?.credentials || []),
          ...credentials
        ];
        options.loadOptions.core = {
          ...options.loadOptions.core,
          credentials: combinedCredentials
        };
        options.loadOptions.fetch = getAuthenticatedFetch(options.loadOptions);
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
      onUpdate: () => this.setNeedsUpdate(),
      ...options
    });

    this.setState({
      tileset3d,
      layerMap: {}
    });

    await tileset3d.tilesetInitializationPromise;
    this.updateLoadedTileset();
    this.props.onTilesetLoad?.(tileset3d);
  }

  /** Starts traversal with the viewport set that survived asynchronous source initialization. */
  private updateLoadedTileset(): void {
    const {activeViewports, lastUpdatedViewports} = this.state;
    const viewports = Object.keys(activeViewports).length ? activeViewports : lastUpdatedViewports;
    (this as any)._updateTileset(viewports);
  }
}

/**
 * Selects a format loader from URL conventions that do not expose a useful file extension.
 * @param url Root tileset URL or in-memory blob.
 * @param loaderCandidates Loaders supplied to the layer.
 * @returns The matching loader, or `undefined` when the URL carries no reliable format signal.
 * @internal
 */
export function inferTilesetLoader(
  url: string | Blob,
  loaderCandidates: LoaderWithParser[]
): LoaderWithParser | undefined {
  if (typeof url !== 'string') {
    return undefined;
  }

  const lowerCaseUrl = url.toLowerCase();
  if (lowerCaseUrl.includes('/sceneserver')) {
    return loaderCandidates.find(loader => loader.id === 'i3s' || loader.id === 'slpk');
  }

  return undefined;
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

  if (url instanceof Blob && sourceLoader.id !== 'slpk' && sourceLoader.id !== '3tz') {
    throw new Error(
      'Tile3DSourceLayer Blob inputs require a 3TZ or SLPK archive loader so relative resources can be resolved.'
    );
  }

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
