// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Tile3DLayer, type Tile3DLayerProps} from '@deck.gl/geo-layers';
import type {DefaultProps, UpdateParameters, Viewport} from '@deck.gl/core';
import {TILE_TYPE, Tile3D, Tileset3D} from '@loaders.gl/tiles';
import {load} from '@loaders.gl/core';

/** Color ramp configuration applied to tile content using a numeric feature attribute. */
export type ColorsByAttribute = {
  /** Feature attribute name. */
  attributeName: string;
  /** Minimum attribute value. */
  minValue: number;
  /** Maximum attribute value. */
  maxValue: number;
  /** Minimum color of the applied gradient. */
  minColor: [number, number, number, number];
  /** Maximum color of the applied gradient. */
  maxColor: [number, number, number, number];
  /** Colorization mode. */
  mode: string;
};

/** Filter configuration applied to tile content using a numeric feature attribute. */
export type FiltersByAttribute = {
  /** Feature attribute name. */
  attributeName: string;
  /** Filter value. */
  value: number;
};

type BaseDataDrivenTile3DLayerProps = {
  onTraversalComplete?: (selectedTiles: Tile3D[]) => Tile3D[];
  colorsByAttribute?: ColorsByAttribute | null;
  customizeColors?: (
    tile: Tile3D,
    colorsByAttribute: ColorsByAttribute | null
  ) => Promise<{isColored: boolean; id: string}>;
  filtersByAttribute?: FiltersByAttribute | null;
  filterTile?: (
    tile: Tile3D,
    filtersByAttribute: FiltersByAttribute | null
  ) => Promise<{isFiltered: boolean; id: string}>;
};

/** Props accepted by `DataDrivenTile3DLayer`. */
export type DataDrivenTile3DLayerProps<DataT = unknown> = BaseDataDrivenTile3DLayerProps &
  Tile3DLayerProps<DataT>;

const defaultProps: DefaultProps<DataDrivenTile3DLayerProps> = {
  colorsByAttribute: null,
  filtersByAttribute: null
};

/**
 * Local copy of the experimental deck.gl-community data-driven 3D tiles layer.
 *
 * This is vendored into loaders.gl so the examples can run against the exact same
 * deck.gl version that the rest of the website bundle uses.
 */
// @ts-expect-error deck.gl keeps several base methods private on Tile3DLayer.
export class DataDrivenTile3DLayer<
  DataT = unknown,
  ExtraProps extends Record<string, unknown> = Record<string, unknown>
> extends Tile3DLayer<DataT, Required<BaseDataDrivenTile3DLayerProps> & ExtraProps> {
  /** deck.gl layer name used in diagnostics and defaults. */
  static layerName = 'DataDrivenTile3DLayer';

  /** Default props for the data-driven tile layer. */
  static defaultProps = defaultProps as any;

  state: {
    activeViewports: any;
    frameNumber?: number;
    lastUpdatedViewports: {[viewportId: string]: Viewport} | null;
    layerMap: {[layerId: string]: any};
    tileset3d: Tileset3D | null;
    colorsByAttribute: ColorsByAttribute | null;
    filtersByAttribute: FiltersByAttribute | null;
    loadingCounter: number;
  } = undefined!;

  /** Initializes local state used for async recoloring and filtering. */
  initializeState(): void {
    super.initializeState();

    this.setState({
      colorsByAttribute: this.props.colorsByAttribute,
      filtersByAttribute: this.props.filtersByAttribute,
      loadingCounter: 0
    });
  }

  /** Updates tileset state and reapplies color/filter hooks when props change. */
  updateState(params: UpdateParameters<this>): void {
    const {props, oldProps, changeFlags} = params;

    if (props.data && props.data !== oldProps.data) {
      this._loadTileset(props.data);
    } else if (props.colorsByAttribute !== oldProps.colorsByAttribute) {
      this.setState({colorsByAttribute: props.colorsByAttribute});
      this._colorizeTileset();
    } else if (props.filtersByAttribute !== oldProps.filtersByAttribute) {
      this.setState({filtersByAttribute: props.filtersByAttribute});
      this._filterTileset();
    } else if (changeFlags.viewportChanged) {
      const {activeViewports} = this.state;
      const viewportCount = Object.keys(activeViewports).length;
      if (viewportCount) {
        if (!this.state.loadingCounter) {
          // @ts-expect-error deck.gl keeps this method private on the base class.
          super._updateTileset(activeViewports);
        }
        this.state.lastUpdatedViewports = activeViewports;
        this.state.activeViewports = {};
      }
    } else {
      super.updateState(params);
    }
  }

  /** Loads the root tileset and installs traversal hooks on the resolved `Tileset3D`. */
  private override async _loadTileset(tilesetUrl: string): Promise<void> {
    const {loadOptions = {}} = this.props;

    let loader: any = this.props.loader || this.props.loaders;
    if (Array.isArray(loader)) {
      loader = loader[0];
    }

    const options = {loadOptions: {...loadOptions}};
    if (loader.preload) {
      const preloadOptions = await loader.preload(tilesetUrl, loadOptions);

      if (preloadOptions.headers) {
        options.loadOptions.fetch = {
          ...options.loadOptions.fetch,
          headers: preloadOptions.headers
        };
      }
      Object.assign(options, preloadOptions);
    }
    const tilesetJson = await load(tilesetUrl, loader, options.loadOptions);

    // @ts-expect-error deck.gl keeps this method private on the base class.
    const onTileUnload = super._onTileUnload.bind(this);

    // @ts-expect-error the base layer passes parsed tileset payloads here.
    const tileset3d = new Tileset3D(tilesetJson, {
      onTileLoad: this._onTileLoad.bind(this),
      onTileUnload,
      onTileError: this.props.onTileError,
      onTraversalComplete: this._onTraversalComplete.bind(this),
      ...options
    });

    this.setState({
      tileset3d,
      layerMap: {}
    });

    // @ts-expect-error deck.gl keeps this method private on the base class.
    super._updateTileset(this.state.activeViewports);
    this.props.onTilesetLoad?.(tileset3d);
  }

  /** Reapplies data-driven changes when a new tile is loaded. */
  private override _onTileLoad(tileHeader: Tile3D): void {
    const {lastUpdatedViewports} = this.state;
    this._colorizeTiles([tileHeader]);
    this._filterTiles([tileHeader]);
    this.props.onTileLoad?.(tileHeader);
    if (!this.state.colorsByAttribute && !this.state.filtersByAttribute) {
      // @ts-expect-error deck.gl keeps this method private on the base class.
      super._updateTileset(lastUpdatedViewports);
      this.setNeedsUpdate();
    }
  }

  /** Applies data-driven tile updates after traversal finishes. */
  private _onTraversalComplete(selectedTiles: Tile3D[]): Tile3D[] {
    this._colorizeTiles(selectedTiles);
    this._filterTiles(selectedTiles);
    return this.props.onTraversalComplete
      ? this.props.onTraversalComplete(selectedTiles)
      : selectedTiles;
  }

  /** Applies custom per-tile color updates. */
  private _colorizeTiles(tiles: Tile3D[]): void {
    if (this.props.customizeColors && tiles[0]?.type === TILE_TYPE.MESH) {
      const {layerMap, colorsByAttribute} = this.state;
      const promises: Promise<{isColored: boolean; id: string}>[] = [];
      for (const tile of tiles) {
        promises.push(this.props.customizeColors(tile, colorsByAttribute));
      }
      this.setState({
        loadingCounter: this.state.loadingCounter + 1
      });
      Promise.allSettled(promises).then(result => {
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
          // @ts-expect-error deck.gl keeps this method private on the base class.
          super._updateTileset(this.state.activeViewports);
          this.setNeedsUpdate();
        }
      });
    }
  }

  /** Reapplies custom color state to the currently selected tileset tiles. */
  private _colorizeTileset(): void {
    const {tileset3d} = this.state;

    if (tileset3d) {
      this._colorizeTiles(tileset3d.selectedTiles);
    }
  }

  /** Applies custom per-tile filtering updates. */
  private _filterTiles(tiles: Tile3D[]): void {
    if (this.props.filterTile && tiles[0]?.type === TILE_TYPE.MESH) {
      const {layerMap, filtersByAttribute} = this.state;
      const promises: Promise<{isFiltered: boolean; id: string}>[] = [];
      for (const tile of tiles) {
        promises.push(this.props.filterTile(tile, filtersByAttribute));
      }
      this.setState({
        loadingCounter: this.state.loadingCounter + 1
      });
      Promise.allSettled(promises).then(result => {
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
          // @ts-expect-error deck.gl keeps this method private on the base class.
          super._updateTileset(this.state.activeViewports);
          this.setNeedsUpdate();
        }
      });
    }
  }

  /** Reapplies filter state to the currently selected tileset tiles. */
  private _filterTileset(): void {
    const {tileset3d} = this.state;

    if (tileset3d) {
      this._filterTiles(tileset3d.selectedTiles);
    }
  }
}
