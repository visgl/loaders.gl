// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DataDrivenTile3DLayer} from './data-driven-tile-3d-layer';
import {Tileset3D, type Tileset3DProps} from '@loaders.gl/tiles';
import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import {createSource} from './tile-3d-source-layer';

/**
 * Internal `DataDrivenTile3DLayer` adapter that constructs source-backed `Tileset3D` instances.
 *
 * This class is exported for internal repository use and examples, and is not documented
 * beyond these TSDoc comments.
 */
export class SourceDataDrivenTile3DLayer<
  DataT = any,
  ExtraProps extends Record<string, unknown> = Record<string, unknown>
> extends DataDrivenTile3DLayer<DataT, ExtraProps> {
  /** deck.gl layer name used for warnings, defaults, and diagnostics. */
  static layerName = 'SourceDataDrivenTile3DLayer';

  /** Install source-backed loading hooks after the base layer initializes its state. */
  initializeState(): void {
    super.initializeState();
    (this as any)._loadTileset = this.loadSourceTileset.bind(this);
  }

  /**
   * Loads a tileset using explicit source construction.
   * @param tilesetUrl Root tileset metadata URL.
   */
  private async loadSourceTileset(tilesetUrl: string): Promise<void> {
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

    const source = createSource(actualTilesetUrl, loader, options.loadOptions);
    const tileset3d = new Tileset3D(source, {
      onTileLoad: (this as any)._onTileLoad.bind(this),
      onTileUnload: (this as any)._onTileUnload.bind(this),
      onTileError: this.props.onTileError,
      onTraversalComplete: (this as any)._onTraversalComplete.bind(this),
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
