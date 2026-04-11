// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DataDrivenTile3DLayer} from '@deck.gl-community/experimental';
import type {
  ColorsByAttribute,
  FiltersByAttribute
} from '@deck.gl-community/experimental/src/data-driven-tile-3d-layer/data-driven-tile-3d-layer';
import {TILE_TYPE, Tile3D, Tileset3D, type Tileset3DProps} from '@loaders.gl/tiles';
import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import {createSource} from './source-tile-3d-layer';

/**
 * Example-local `DataDrivenTile3DLayer` variant that constructs source-backed tilesets.
 */
export class SourceDataDrivenTile3DLayer<
  DataT = any,
  ExtraProps extends Record<string, unknown> = Record<string, unknown>
> extends DataDrivenTile3DLayer<DataT, ExtraProps> {
  /**
   * Loads a tileset using explicit source construction.
   */
  //@ts-expect-error private base method replacement
  protected async _loadTileset(tilesetUrl: string): Promise<void> {
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
      onTileLoad: this._onTileLoad.bind(this),
      // @ts-expect-error private base helper
      onTileUnload: super._onTileUnload.bind(this),
      onTileError: this.props.onTileError,
      onTraversalComplete: this._onTraversalComplete.bind(this),
      ...options
    });

    this.setState({
      tileset3d,
      layerMap: {}
    });

    await tileset3d.tilesetInitializationPromise;
    // @ts-expect-error private base helper
    super._updateTileset(this.state.activeViewports);
    this.props.onTilesetLoad?.(tileset3d);
  }

  private _onTileLoad(tileHeader: Tile3D): void {
    const {lastUpdatedViewports} = this.state;
    this._colorizeTiles([tileHeader]);
    this._filterTiles([tileHeader]);
    this.props.onTileLoad(tileHeader);
    if (!this.state.colorsByAttribute && !this.state.filtersByAttribute) {
      // @ts-expect-error private base helper
      super._updateTileset(lastUpdatedViewports);
      this.setNeedsUpdate();
    }
  }

  private _onTraversalComplete(selectedTiles: Tile3D[]): Tile3D[] {
    this._colorizeTiles(selectedTiles);
    this._filterTiles(selectedTiles);
    return this.props.onTraversalComplete
      ? this.props.onTraversalComplete(selectedTiles)
      : selectedTiles;
  }

  private _colorizeTiles(tiles: Tile3D[]): void {
    if (this.props.customizeColors && tiles[0]?.type === TILE_TYPE.MESH) {
      const {layerMap, colorsByAttribute} = this.state as {
        layerMap: {[layerId: string]: any};
        colorsByAttribute: ColorsByAttribute | null;
        loadingCounter: number;
      };
      const promises: Promise<{isColored: boolean; id: string}>[] = [];
      for (const tile of tiles) {
        promises.push(this.props.customizeColors(tile, colorsByAttribute));
      }
      this.setState({
        loadingCounter: this.state.loadingCounter + 1
      });
      Promise.allSettled(promises).then((result) => {
        this.setState({
          loadingCounter: this.state.loadingCounter - 1
        });
        let isTileChanged = false;
        for (const item of result) {
          if (item.status === 'fulfilled' && item.value.isColored) {
            isTileChanged = true;
            delete layerMap[item.value.id];
          }
        }
        if (isTileChanged && !this.state.loadingCounter) {
          // @ts-expect-error private base helper
          super._updateTileset(this.state.activeViewports);
          this.setNeedsUpdate();
        }
      });
    }
  }

  private _filterTiles(tiles: Tile3D[]): void {
    if (this.props.filterTile && tiles[0]?.type === TILE_TYPE.MESH) {
      const {layerMap, filtersByAttribute} = this.state as {
        layerMap: {[layerId: string]: any};
        filtersByAttribute: FiltersByAttribute | null;
        loadingCounter: number;
      };
      const promises: Promise<{isFiltered: boolean; id: string}>[] = [];
      for (const tile of tiles) {
        promises.push(this.props.filterTile(tile, filtersByAttribute));
      }
      this.setState({
        loadingCounter: this.state.loadingCounter + 1
      });
      Promise.allSettled(promises).then((result) => {
        this.setState({
          loadingCounter: this.state.loadingCounter - 1
        });
        let isTileChanged = false;
        for (const item of result) {
          if (item.status === 'fulfilled' && item.value.isFiltered) {
            isTileChanged = true;
            delete layerMap[item.value.id];
          }
        }
        if (isTileChanged && !this.state.loadingCounter) {
          // @ts-expect-error private base helper
          super._updateTileset(this.state.activeViewports);
          this.setNeedsUpdate();
        }
      });
    }
  }
}
