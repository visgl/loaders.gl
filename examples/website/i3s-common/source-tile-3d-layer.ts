// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log, type UpdateParameters} from '@deck.gl/core';
import {Tile3DLayer, type Tile3DLayerProps} from '@deck.gl/geo-layers';
import {I3SSource, Tiles3DSource, Tileset3D, type Tileset3DProps} from '@loaders.gl/tiles';
import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';

/**
 * Example-local `Tile3DLayer` variant that constructs source-backed tilesets.
 */
export class SourceTile3DLayer<
  DataT = any,
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtraProps extends {} = {}
> extends Tile3DLayer<DataT, Tile3DLayerProps & ExtraProps> {
  static layerName = 'SourceTile3DLayer';
  static defaultProps = Tile3DLayer.defaultProps as any;

  //@ts-expect-error override of base class method with private helper usage
  updateState({props, oldProps, changeFlags}: UpdateParameters<this>): void {
    //@ts-expect-error private base helper
    if ((props.data || typeof props.data === 'string') && props.data !== oldProps.data) {
      //@ts-expect-error private base helper
      this._loadTileset(props.data);
    }

    if (changeFlags.viewportChanged) {
      //@ts-expect-error private base state
      const {activeViewports} = this.state;
      const viewportsNumber = Object.keys(activeViewports).length;
      if (viewportsNumber) {
        //@ts-expect-error private base helper
        this._updateTileset(activeViewports);
        //@ts-expect-error private base state
        this.state.lastUpdatedViewports = activeViewports;
        //@ts-expect-error private base state
        this.state.activeViewports = {};
      }
    }
    if (changeFlags.propsChanged) {
      //@ts-expect-error private base state
      const {layerMap} = this.state;
      for (const key in layerMap) {
        layerMap[key].needsUpdate = true;
      }
    }
  }

  /**
   * Loads a tileset using explicit source construction.
   */
  //@ts-expect-error private base method replacement
  protected async _loadTileset(tilesetUrl: string): Promise<void> {
    const {loadOptions = {}} = this.props;

    if ('onTileLoadFail' in this.props) {
      log.removed('onTileLoadFail', 'onTileError')();
    }

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

    const source = createSource(actualTilesetUrl, loader, options.loadOptions);
    const tileset3d = new Tileset3D(source, {
      onTileLoad: this._onTileLoad.bind(this),
      onTileUnload: this._onTileUnload.bind(this),
      onTileError: this.props.onTileError,
      ...options
    });

    //@ts-expect-error private base state
    this.setState({
      tileset3d,
      layerMap: {}
    });

    await tileset3d.tilesetInitializationPromise;
    //@ts-expect-error private base helper
    this._updateTileset(this.state.activeViewports);
    this.props.onTilesetLoad?.(tileset3d);
  }
}

/**
 * Creates the format-specific source for a layer loader.
 */
export function createSource(
  url: string,
  loader: LoaderWithParser,
  loadOptions: LoaderOptions
): Tiles3DSource | I3SSource {
  if (loader.id === 'i3s' || loader.id === 'slpk') {
    return new I3SSource({url, loader}, loadOptions);
  }

  return new Tiles3DSource({url, loader}, loadOptions);
}
