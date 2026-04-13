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
import {coreApi} from '@loaders.gl/core';
import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';

/**
 * Props for {@link Tile3DSourceLayer}.
 */
export type Tile3DSourceLayerProps<DataT = unknown> = Omit<Tile3DLayerProps<DataT>, 'data'> & {
  /** Root tileset URL or a pre-constructed tileset source. */
  data: string | Tileset3DSource;
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

  /** Install source-backed loading hooks after the base layer initializes its state. */
  initializeState(): void {
    super.initializeState();
    (this as any)._loadTileset = this.loadSourceTileset.bind(this);
  }

  /**
   * Loads a tileset from either a URL or a pre-constructed tileset source.
   * @param data Tileset URL or fully constructed source.
   */
  private async loadSourceTileset(data: string | Tileset3DSource): Promise<void> {
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
    // @ts-ignore
    const loaders = this.props.loader || this.props.loaders;
    const loader = (Array.isArray(loaders) ? loaders[0] : loaders) as LoaderWithParser;

    const options: {loadOptions: LoaderOptions} & Partial<Tileset3DProps> = {
      loadOptions: {...loadOptions}
    };
    let actualTilesetUrl = tilesetUrl;

    if (loader.preload) {
      const preloadOptions = await loader.preload(tilesetUrl, loadOptions);
      if (preloadOptions.url) {
        actualTilesetUrl = preloadOptions.url;
      }

      if (preloadOptions.headers) {
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
  url: string,
  loader: LoaderWithParser,
  loadOptions: LoaderOptions,
  injectedCoreApi = coreApi
): Tiles3DSource | I3SSource {
  if (loader.id === 'i3s' || loader.id === 'slpk') {
    return new I3SSource({url, loader, coreApi: injectedCoreApi}, loadOptions);
  }

  return new Tiles3DSource({url, loader, coreApi: injectedCoreApi}, loadOptions);
}
