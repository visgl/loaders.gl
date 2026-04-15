import type {DefaultProps, UpdateParameters, Viewport} from '@deck.gl/core';
import {Tile3DLayer, type Tile3DLayerProps} from '@deck.gl/geo-layers';
import {load} from '@loaders.gl/core';
import {type Tile3D, TILE_TYPE, Tileset3D} from '@loaders.gl/tiles';
import type {
  ColorsByAttribute,
  CustomizeTileColors,
  CustomizeTileFilter,
  FiltersByAttribute
} from './types';

type DataDrivenTile3DLayerExtraProps<DataType = any> = {
  onTraversalComplete?: (selectedTiles: Tile3D[]) => Tile3D[];
  colorsByAttribute?: ColorsByAttribute | null;
  customizeColors?: CustomizeTileColors;
  filtersByAttribute?: FiltersByAttribute | null;
  filterTile?: CustomizeTileFilter;
} & Tile3DLayerProps<DataType>;

type DataDrivenTile3DLayerState = {
  activeViewports: any;
  frameNumber?: number;
  lastUpdatedViewports: {[viewportId: string]: Viewport} | null;
  layerMap: {[layerId: string]: any};
  tileset3d: Tileset3D | null;
  colorsByAttribute: ColorsByAttribute | null;
  filtersByAttribute: FiltersByAttribute | null;
  loadingCounter: number;
};

const defaultProps: DefaultProps<DataDrivenTile3DLayerExtraProps> = {
  colorsByAttribute: null,
  filtersByAttribute: null
};

/**
 * Local deck.gl 9.3-compatible copy of the community data-driven Tile3D layer.
 */
export class DataDrivenTile3DLayer<
  DataType = any,
  ExtraProps extends Record<string, unknown> = Record<string, unknown>
> extends Tile3DLayer<DataType, DataDrivenTile3DLayerExtraProps<DataType> & ExtraProps> {
  static layerName = 'LocalDataDrivenTile3DLayer';
  static defaultProps = defaultProps as any;

  state: DataDrivenTile3DLayerState = undefined!;

  initializeState(): void {
    super.initializeState();

    this.setState({
      colorsByAttribute: this.props.colorsByAttribute,
      filtersByAttribute: this.props.filtersByAttribute,
      loadingCounter: 0
    });
  }

  updateState(params: UpdateParameters<this>): void {
    const {props, oldProps, changeFlags} = params;

    if (props.data && props.data !== oldProps.data) {
      void this.loadTilesetData(props.data);
      return;
    }

    if (props.colorsByAttribute !== oldProps.colorsByAttribute) {
      this.setState({colorsByAttribute: props.colorsByAttribute});
      this._colorizeTileset();
      return;
    }

    if (props.filtersByAttribute !== oldProps.filtersByAttribute) {
      this.setState({filtersByAttribute: props.filtersByAttribute});
      this._filterTileset();
      return;
    }

    if (changeFlags.viewportChanged) {
      const {activeViewports} = this.state;
      if (Object.keys(activeViewports).length && !this.state.loadingCounter) {
        // @ts-expect-error Accessing Tile3DLayer private method intentionally.
        super._updateTileset(activeViewports);
        this.state.lastUpdatedViewports = activeViewports;
        this.state.activeViewports = {};
      }
      return;
    }

    super.updateState(params);
  }

  private async loadTilesetData(tilesetUrl: string): Promise<void> {
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
    const tileset3d = new Tileset3D(tilesetJson, {
      onTileLoad: this.handleTileLoad.bind(this),
      // @ts-expect-error Accessing Tile3DLayer private method intentionally.
      onTileUnload: super._onTileUnload.bind(this),
      onTileError: this.props.onTileError,
      onTraversalComplete: this.handleTraversalComplete.bind(this),
      ...options
    });

    this.setState({
      tileset3d,
      layerMap: {}
    });

    // @ts-expect-error Accessing Tile3DLayer private method intentionally.
    super._updateTileset(this.state.activeViewports);
    this.props.onTilesetLoad?.(tileset3d);
  }

  private handleTileLoad(tileHeader: Tile3D): void {
    const {lastUpdatedViewports} = this.state;

    this._colorizeTiles([tileHeader]);
    this._filterTiles([tileHeader]);
    this.props.onTileLoad?.(tileHeader);

    if (!this.state.colorsByAttribute && !this.state.filtersByAttribute) {
      // @ts-expect-error Accessing Tile3DLayer private method intentionally.
      super._updateTileset(lastUpdatedViewports);
      this.setNeedsUpdate();
    }
  }

  private handleTraversalComplete(selectedTiles: Tile3D[]): Tile3D[] {
    this._colorizeTiles(selectedTiles);
    this._filterTiles(selectedTiles);
    return this.props.onTraversalComplete
      ? this.props.onTraversalComplete(selectedTiles)
      : selectedTiles;
  }

  private _colorizeTiles(tiles: Tile3D[]): void {
    if (!this.props.customizeColors || tiles[0]?.type !== TILE_TYPE.MESH) {
      return;
    }

    const {layerMap, colorsByAttribute} = this.state;
    const promises = tiles.map((tile) => this.props.customizeColors!(tile, colorsByAttribute));

    this.setState({loadingCounter: this.state.loadingCounter + 1});
    Promise.allSettled(promises).then((results) => {
      this.setState({loadingCounter: this.state.loadingCounter - 1});

      let tileChanged = false;
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.isUpdated) {
          tileChanged = true;
          delete layerMap[result.value.id];
        }
      }

      if (tileChanged && !this.state.loadingCounter) {
        // @ts-expect-error Accessing Tile3DLayer private method intentionally.
        super._updateTileset(this.state.activeViewports);
        this.setNeedsUpdate();
      }
    });
  }

  private _colorizeTileset(): void {
    const {tileset3d} = this.state;
    if (tileset3d) {
      this._colorizeTiles(tileset3d.selectedTiles);
    }
  }

  private _filterTiles(tiles: Tile3D[]): void {
    if (!this.props.filterTile || tiles[0]?.type !== TILE_TYPE.MESH) {
      return;
    }

    const {layerMap, filtersByAttribute} = this.state;
    const promises = tiles.map((tile) => this.props.filterTile!(tile, filtersByAttribute));

    this.setState({loadingCounter: this.state.loadingCounter + 1});
    Promise.allSettled(promises).then((results) => {
      this.setState({loadingCounter: this.state.loadingCounter - 1});

      let tileChanged = false;
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.isUpdated) {
          tileChanged = true;
          delete layerMap[result.value.id];
        }
      }

      if (tileChanged && !this.state.loadingCounter) {
        // @ts-expect-error Accessing Tile3DLayer private method intentionally.
        super._updateTileset(this.state.activeViewports);
        this.setNeedsUpdate();
      }
    });
  }

  private _filterTileset(): void {
    const {tileset3d} = this.state;
    if (tileset3d) {
      this._filterTiles(tileset3d.selectedTiles);
    }
  }
}
