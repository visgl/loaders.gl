// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompositeLayer,
  type CompositeLayerProps,
  Layer,
  type LayersList,
  type PickingInfo,
  type GetPickingInfoParams,
  _flatten as flatten
} from '@deck.gl/core';
import {MVTLayer, TileLayer, type TileLayerProps} from '@deck.gl/geo-layers';
import {BitmapLayer, GeoJsonLayer, PathLayer} from '@deck.gl/layers';
import {createDataSource} from '@loaders.gl/core';
import type {
  DataSourceOptions,
  GetTileDataParameters,
  Source,
  TileSource,
  TileSourceMetadata
} from '@loaders.gl/loader-utils';
import {SharedTile2DHeader, Tileset2D, type Tileset2DProps} from '@loaders.gl/tiles';
import {Matrix4, type NumericArray} from '@math.gl/core';
import {sharedTile2DDeckAdapter} from './shared-tile-2d/deck-tileset-adapter';
import {SharedTile2DView} from './shared-tile-2d/shared-tile-2d-view';

/** Runtime shape used by loaders.gl source-backed tile layers. */
export type TileSourceRuntime = TileSource & {
  /** Indicates that vector tiles can be rendered in local coordinates. */
  localCoordinates?: boolean;
  /** MIME type that identifies vector or image payload handling. */
  mimeType: string | null;
  /** Mutable source options forwarded to loaders.gl tile fetches. */
  options: {
    table?: {
      coordinates?: string;
    };
  };
  /** Source URL used for stable layer ids. */
  url?: string;
};

type Tile2DSourceLayerData = string | Blob | TileSourceRuntime;

/** Props for {@link Tile2DSourceLayer}. */
export type Tile2DSourceLayerProps<DataT = unknown> = CompositeLayerProps &
  Partial<Omit<TileLayerProps, 'data' | 'renderSubLayers'>> & {
    /** URL/blob input or a fully constructed loaders.gl tile source. */
    data: Tile2DSourceLayerData;
    /** Source factories used to auto-create tile sources from URL/blob inputs. */
    sources?: Readonly<Source[]>;
    /** Options forwarded to `createDataSource` when `sources` are supplied. */
    sourceOptions?: DataSourceOptions;
    /** Optional metadata used by the example overlay and zoom bounds. */
    metadata?: TileSourceMetadata | null;
    /** Show borders around tiles in the generic shared-tile rendering path. */
    showTileBorders?: boolean;
    /** Called when a tile payload cannot be fetched or parsed. */
    onTileError?: (error: unknown, tileParameters?: unknown) => void;
    /** Called when the viewport's currently selected tiles are loaded. */
    onTilesLoad?: (tiles: SharedTile2DHeader<DataT>[]) => void;
    /** Custom sub-layer factory for non-local shared-tile rendering. */
    renderSubLayers?: (
      props: Tile2DSourceLayerProps<DataT> & {
        id: string;
        data: DataT;
        _offset: number;
        tile: SharedTile2DHeader<DataT>;
        tileSource: TileSourceRuntime;
      }
    ) => Layer | null | LayersList;
    /** Maximum tile count kept in cache. */
    maxCacheSize?: number | null;
    /** Maximum tile cache byte size. */
    maxCacheByteSize?: number | null;
    /** Minimum zoom level to request. */
    minZoom?: number | null;
    /** Maximum zoom level to request. */
    maxZoom?: number | null;
    /** Maximum concurrent requests issued by the shared tileset. */
    maxRequests?: number;
    /** Debounce interval before issuing queued tile requests. */
    debounceTime?: number;
    /** Integer zoom offset applied during tile selection. */
    zoomOffset?: number;
    /** Tile size in pixels. */
    tileSize?: number;
    /** Bounding box limiting tile generation. */
    extent?: number[] | null;
    /** Elevation range used during tile selection. */
    zRange?: [number, number] | null;
    /** Optional model matrix applied by the surrounding layer stack. */
    modelMatrix?: NumericArray | null;
  };

/** Picking info returned from {@link Tile2DSourceLayer}. */
export type Tile2DSourceLayerPickingInfo<
  DataT = any,
  SubLayerPickingInfo = PickingInfo
> = SubLayerPickingInfo & {
  /** Picked tile when a tile sub-layer is hit. */
  tile?: SharedTile2DHeader<DataT>;
  /** Tile that produced the picked sub-layer. */
  sourceTile: SharedTile2DHeader<DataT>;
  /** Concrete sub-layer instance that handled the pick. */
  sourceTileSubLayer: Layer;
};

type Tile2DSourceLayerState<DataT> = {
  resolvedData: TileSourceRuntime | null;
  tileset: Tileset2D<DataT, any> | null;
  tilesetViews: Map<string, SharedTile2DView<DataT>>;
  isLoaded: boolean;
  frameNumbers: Map<string, number>;
  tileLayers: Map<string, any[]>;
  unsubscribeTilesetEvents: (() => void) | null;
};

const TILE2D_LAYER_DEFAULT_OPTION_VALUES = {
  maxCacheSize: null,
  maxCacheByteSize: null,
  maxZoom: null,
  minZoom: null,
  tileSize: 256,
  extent: null,
  maxRequests: 6,
  debounceTime: 0,
  zoomOffset: 0
} as const;

/**
 * Internal deck.gl MVT helper used by `Tile2DSourceLayer`.
 *
 * This class is not part of the supported public API and is documented only through TSDoc.
 */
class MVTSourceLayer extends MVTLayer<any> {
  /** Sync the cached vector tile source whenever deck.gl reports a data change. */
  updateState(params: any): void {
    super.updateState(params);

    const {props, changeFlags} = params;
    if (changeFlags.dataChanged && props.data) {
      this.setState({
        vectorTileSource: props.data,
        binary: false
      });
    }
  }

  /** Fetch tile payloads directly from the wrapped loaders.gl tile source. */
  async getTileData(parameters: GetTileDataParameters): Promise<any> {
    try {
      const vectorTileSource = (this.state as any).vectorTileSource as TileSourceRuntime | null;
      return vectorTileSource ? await vectorTileSource.getTileData(parameters) : null;
    } catch (error) {
      this.props.onTileError?.(error, parameters);
      return null;
    }
  }
}

/**
 * Internal deck.gl layer that renders loaders.gl tile sources through a shared 2D tileset.
 *
 * It resolves URL/blob inputs using loaders.gl source factories, uses `Tileset2D`
 * for shared raster and non-local vector traversal, and falls back to `MVTLayer` for
 * local-coordinate vector tile sources.
 *
 * This class is exported for internal repository use and examples, and is not documented
 * beyond these TSDoc comments.
 */
export class Tile2DSourceLayer<DataT = any> extends CompositeLayer<Tile2DSourceLayerProps<DataT>> {
  /** deck.gl layer name used in debugging output. */
  static layerName = 'Tile2DSourceLayer';

  /** Default props shared by the vector and raster rendering paths. */
  static defaultProps = {
    ...TileLayer.defaultProps,
    tileSize: 256,
    minZoom: null,
    maxZoom: null,
    maxCacheSize: null,
    maxCacheByteSize: null,
    maxRequests: 6,
    debounceTime: 0,
    zoomOffset: 0,
    showTileBorders: true,
    renderSubLayers: defaultRenderSubLayers
  };

  /** Viewports tracked by id so shared tileset views stay stable across renders. */
  private _knownViewports: Map<string, any> = new Map();
  /** Typed deck.gl state for source resolution, traversal views, and tile sublayers. */
  state = null as unknown as Tile2DSourceLayerState<DataT>;

  /** Initializes local state before props are first rendered. */
  initializeState(): void {
    this._knownViewports.clear();
    if (this.context.viewport) {
      this._knownViewports.set(this._getViewportKey(), this.context.viewport);
    }
    this.state = {
      resolvedData: null,
      tileset: null,
      tilesetViews: new Map(),
      isLoaded: false,
      frameNumbers: new Map(),
      tileLayers: new Map(),
      unsubscribeTilesetEvents: null
    };
  }

  /** Finalizes owned resources and detaches from the shared tileset. */
  finalizeState(): void {
    this._releaseTileset();
  }

  /** Returns whether all visible sub-layers for all tracked views are loaded. */
  get isLoaded(): boolean {
    const {tilesetViews, tileLayers} = this.state;
    if (!tilesetViews.size) {
      return false;
    }
    return Boolean(
      Array.from(tilesetViews.values()).every(tilesetView =>
        tilesetView.selectedTiles?.every(tile => {
          const cachedLayers = tileLayers.get(tile.id);
          return (
            tile.isLoaded &&
            (!tile.content || !cachedLayers || cachedLayers.every(layer => layer.isLoaded))
          );
        })
      )
    );
  }

  /** Triggers updates whenever props, data, or update triggers change. */
  shouldUpdateState({changeFlags}: any): boolean {
    return changeFlags.somethingChanged;
  }

  /** Resolves sources and keeps the shared tileset in sync with current props. */
  updateState({props, oldProps, changeFlags}: any): void {
    if (this.context.viewport) {
      this._knownViewports.set(this._getViewportKey(), this.context.viewport);
    }

    const previousResolvedData = this.state.resolvedData;
    let resolvedData = previousResolvedData;
    const dataChanged =
      changeFlags.dataChanged ||
      props.sources !== oldProps.sources ||
      props.sourceOptions !== oldProps.sourceOptions;

    if (dataChanged) {
      resolvedData = this._resolveData(props);
      this.setState({resolvedData});
    }

    if (!resolvedData || this.sourceSupportsMVTLayer(resolvedData)) {
      this._releaseTileset();
      return;
    }

    const resolvedDataChanged = resolvedData !== previousResolvedData;
    const tileset = this._getOrCreateTileset(resolvedData, resolvedDataChanged);
    if (tileset !== this.state.tileset) {
      this.setState({tileset});
    } else {
      tileset.setOptions(this._getTilesetOptions(resolvedData));
      if (dataChanged) {
        tileset.reloadAll();
      } else if (changeFlags.propsOrDataChanged || changeFlags.updateTriggersChanged) {
        this.state.tileLayers.clear();
      }
    }

    this._updateTileset();
  }

  /** Adds tile references to picking info returned from sub-layers. */
  getPickingInfo(params: GetPickingInfoParams): Tile2DSourceLayerPickingInfo<DataT> {
    const {sourceLayer} = params;
    if (!sourceLayer) {
      throw new Error('Tile2DSourceLayer picking info requires a source layer.');
    }
    const sourceTile: SharedTile2DHeader<DataT> = (sourceLayer.props as any).tile;
    const info = params.info as Tile2DSourceLayerPickingInfo<DataT>;
    if (info.picked) {
      info.tile = sourceTile;
    }
    info.sourceTile = sourceTile;
    info.sourceTileSubLayer = sourceLayer;
    return info;
  }

  /** Forwards auto-highlight updates to the picked sub-layer. */
  protected _updateAutoHighlight(info: Tile2DSourceLayerPickingInfo<DataT>): void {
    info.sourceTileSubLayer.updateAutoHighlight(info);
  }

  /** Registers additional viewports in multi-view rendering scenarios. */
  activateViewport(viewport: any): void {
    const viewportKey = viewport.id || 'default';
    const previousViewport = this._knownViewports.get(viewportKey);
    this._knownViewports.set(viewportKey, viewport);
    if (!previousViewport || !viewport.equals(previousViewport)) {
      this.setNeedsUpdate();
    }
    super.activateViewport(viewport);
  }

  /** Filters tile sub-layers based on the active view-specific visibility state. */
  filterSubLayer({layer, cullRect}: any) {
    if (!this.state.tileset) {
      return true;
    }
    const {tile} = (layer as Layer<{tile: SharedTile2DHeader<DataT>}>).props;
    const tilesetView = this._getOrCreateTilesetView(this._getViewportKey());
    return tilesetView.isTileVisible(
      tile,
      cullRect,
      this.props.modelMatrix ? new Matrix4(this.props.modelMatrix) : null
    );
  }

  /** Render either the local-coordinate MVT path or the shared raster/vector path. */
  renderLayers(): Layer | null | LayersList {
    const {resolvedData, tileset, tileLayers} = this.state;
    if (!resolvedData) {
      return null;
    }

    if (this.sourceSupportsMVTLayer(resolvedData)) {
      resolvedData.options.table = resolvedData.options.table || {};
      resolvedData.options.table.coordinates = 'local';
      return this.renderMVTLayer(resolvedData);
    }

    if (!tileset) {
      return null;
    }

    resolvedData.options.table = resolvedData.options.table || {};
    resolvedData.options.table.coordinates = 'wgs84';

    return tileset.tiles.map(tile => {
      let layers = tileLayers.get(tile.id);
      if (!tile.isLoaded && !tile.content) {
        return layers;
      }
      if (!layers) {
        const rendered = this.props.renderSubLayers
          ? this.props.renderSubLayers({
              ...this.props,
              ...this.getSubLayerProps({
                id: tile.id,
                updateTriggers: this.props.updateTriggers
              }),
              data: tile.content as DataT,
              _offset: 0,
              tile,
              tileSource: resolvedData
            } as any)
          : null;
        layers = this._flattenTileLayers(rendered);
        tileLayers.set(tile.id, layers);
      }
      return layers;
    });
  }

  /** Check if the current source supports MVT layer rendering with local coordinates. */
  sourceSupportsMVTLayer(tileSource: TileSourceRuntime): boolean {
    return (
      tileSource.mimeType === 'application/vnd.mapbox-vector-tile' &&
      Boolean(tileSource.localCoordinates)
    );
  }

  /** Render vector tiles through `MVTLayer` when local coordinate support is required. */
  renderMVTLayer(tileSource: TileSourceRuntime) {
    const {showTileBorders, metadata, onTilesLoad, onTileError} = this.props;
    const minZoom = metadata?.minZoom || 0;
    const maxZoom = metadata?.maxZoom || 30;
    const devicePixelRatio = this.context.device.getCanvasContext().getDevicePixelRatio();

    return [
      new MVTSourceLayer({
        id: `${this.props.id}-mvt`,
        data: tileSource as any,
        getLineColor: [0, 0, 0],
        getLineWidth: 1,
        getFillColor: [100, 120, 140],
        lineWidthUnits: 'pixels',
        pickable: true,
        autoHighlight: true,
        onViewportLoad: onTilesLoad,
        onTileError,
        minZoom,
        maxZoom,
        tileSize: 256,
        zoomOffset: devicePixelRatio === 1 ? -1 : 0,
        showTileBorders
      } as any)
    ];
  }

  /** Resolves the shared tileset configuration from current layer props. */
  private _getTilesetOptions(
    tileSource: TileSourceRuntime
  ): Omit<Tileset2DProps<DataT, any>, 'tileSource'> & {tileSource: TileSourceRuntime} {
    const {
      tileSize,
      maxCacheSize,
      maxCacheByteSize,
      extent,
      maxZoom,
      minZoom,
      maxRequests,
      debounceTime,
      zoomOffset
    } = this.props;
    const devicePixelRatio = this.context.device.getCanvasContext().getDevicePixelRatio();
    const effectiveZoomOffset = this._isDefaultOptionValue(
      zoomOffset,
      TILE2D_LAYER_DEFAULT_OPTION_VALUES.zoomOffset
    )
      ? devicePixelRatio === 1
        ? -1
        : 0
      : zoomOffset;

    const options = {
      tileSource,
      adapter: sharedTile2DDeckAdapter,
      tileSize,
      zoomOffset: effectiveZoomOffset,
      onTileLoad: () => {},
      onTileError: () => {},
      onTileUnload: () => {}
    } as Omit<Tileset2DProps<DataT, any>, 'getTileData'>;

    this._assignTilesetOptionIfExplicit(
      options,
      'maxCacheSize',
      maxCacheSize,
      TILE2D_LAYER_DEFAULT_OPTION_VALUES.maxCacheSize
    );
    this._assignTilesetOptionIfExplicit(
      options,
      'maxCacheByteSize',
      maxCacheByteSize,
      TILE2D_LAYER_DEFAULT_OPTION_VALUES.maxCacheByteSize
    );
    this._assignTilesetOptionIfExplicit(
      options,
      'maxZoom',
      maxZoom,
      TILE2D_LAYER_DEFAULT_OPTION_VALUES.maxZoom
    );
    this._assignTilesetOptionIfExplicit(
      options,
      'minZoom',
      minZoom,
      TILE2D_LAYER_DEFAULT_OPTION_VALUES.minZoom
    );
    this._assignTilesetOptionIfExplicit(
      options,
      'extent',
      extent,
      TILE2D_LAYER_DEFAULT_OPTION_VALUES.extent
    );
    this._assignTilesetOptionIfExplicit(
      options,
      'maxRequests',
      maxRequests,
      TILE2D_LAYER_DEFAULT_OPTION_VALUES.maxRequests
    );
    this._assignTilesetOptionIfExplicit(
      options,
      'debounceTime',
      debounceTime,
      TILE2D_LAYER_DEFAULT_OPTION_VALUES.debounceTime
    );
    return options as Omit<Tileset2DProps<DataT, any>, 'getTileData'> & {
      tileSource: TileSourceRuntime;
    };
  }

  /** Creates or reuses the internal shared tileset for the current source. */
  private _getOrCreateTileset(
    tileSource: TileSourceRuntime,
    resolvedDataChanged: boolean
  ): Tileset2D<DataT, any> {
    if (!this.state.tileset || resolvedDataChanged) {
      this._releaseTileset();
      const tileset = Tileset2D.fromTileSource<DataT>(
        tileSource,
        this._getTilesetOptions(tileSource)
      );
      this.setState({
        tileset,
        tilesetViews: new Map(),
        tileLayers: new Map(),
        frameNumbers: new Map(),
        unsubscribeTilesetEvents: tileset.subscribe({
          onTileLoad: this._onTileLoad.bind(this),
          onTileError: this._onTileError.bind(this),
          onTileUnload: this._onTileUnload.bind(this),
          onUpdate: () => this.setNeedsUpdate(),
          onError: error => this.raiseError(error, 'loading TileSource metadata')
        })
      });
      return tileset;
    }

    return this.state.tileset;
  }

  /** Tears down subscriptions and per-view state for the outgoing tileset. */
  private _releaseTileset(): void {
    this.state?.unsubscribeTilesetEvents?.();
    for (const tilesetView of this.state?.tilesetViews?.values?.() || []) {
      tilesetView.finalize();
    }
    this.setState?.({
      tileset: null,
      tilesetViews: new Map(),
      tileLayers: new Map(),
      frameNumbers: new Map(),
      unsubscribeTilesetEvents: null
    });
  }

  /** Updates per-view traversal state for all known viewports. */
  private _updateTileset(): void {
    const {tileset} = this.state;
    if (!tileset) {
      return;
    }

    const {zRange = null, modelMatrix = null} = this.props;
    let anyTilesetChanged = false;

    for (const [viewportKey, viewport] of this._knownViewports) {
      const tilesetView = this._getOrCreateTilesetView(viewportKey);
      const frameNumber = tilesetView.update(viewport, {zRange, modelMatrix});
      const previousFrameNumber = this.state.frameNumbers.get(viewportKey);
      const tilesetChanged = previousFrameNumber !== frameNumber;
      anyTilesetChanged ||= tilesetChanged;

      if (tilesetView.isLoaded && tilesetChanged) {
        this._onViewportLoad(tilesetView);
      }
      if (tilesetChanged) {
        this.state.frameNumbers.set(viewportKey, frameNumber);
      }
    }

    const nextIsLoaded = this.isLoaded;
    const loadingStateChanged = this.state.isLoaded !== nextIsLoaded;
    if (loadingStateChanged) {
      for (const tilesetView of this.state.tilesetViews.values()) {
        if (tilesetView.isLoaded) {
          this._onViewportLoad(tilesetView);
        }
      }
    }

    if (anyTilesetChanged) {
      this.setState({frameNumbers: new Map(this.state.frameNumbers)});
    }
    this.state.isLoaded = nextIsLoaded;
  }

  /** Emits the viewport-load callback for one view. */
  private _onViewportLoad(tilesetView: SharedTile2DView<DataT>): void {
    if (tilesetView.selectedTiles) {
      this.props.onTilesLoad?.(tilesetView.selectedTiles);
    }
  }

  /** Clears cached sub-layers when a tile loads. */
  private _onTileLoad(tile: SharedTile2DHeader<DataT>): void {
    this.state.tileLayers.delete(tile.id);
    this.setNeedsUpdate();
  }

  /** Clears cached sub-layers when a tile errors. */
  private _onTileError(error: any, tile: SharedTile2DHeader<DataT>): void {
    this.state.tileLayers.delete(tile.id);
    this.props.onTileError?.(error, tile);
    this.setNeedsUpdate();
  }

  /** Removes cached sub-layers when a tile is evicted. */
  private _onTileUnload(tile: SharedTile2DHeader<DataT>): void {
    this.state.tileLayers.delete(tile.id);
  }

  /** Returns the active viewport key used to isolate per-view traversal state. */
  private _getViewportKey(): string {
    return this.context.viewport?.id || 'default';
  }

  /** Returns the per-viewport traversal state, creating it on demand. */
  private _getOrCreateTilesetView(viewportKey: string): SharedTile2DView<DataT> {
    let tilesetView = this.state.tilesetViews.get(viewportKey);
    if (!tilesetView) {
      const tileset = this.state.tileset;
      if (!tileset) {
        throw new Error('Tile2DSourceLayer tileset was not initialized.');
      }
      tilesetView = new SharedTile2DView(tileset);
      this.state.tilesetViews.set(viewportKey, tilesetView);
    }
    return tilesetView;
  }

  /** Resolves the `data` prop to a concrete loaders.gl tile source. */
  private _resolveData(props: Tile2DSourceLayerProps<DataT>): TileSourceRuntime | null {
    const {data, sources, sourceOptions = {}} = props;
    if (isTileSourceRuntime(data)) {
      return data;
    }
    if ((typeof data === 'string' || data instanceof Blob) && sources?.length) {
      return createDataSource(data, sources, sourceOptions) as unknown as TileSourceRuntime;
    }
    throw new Error('Tile2DSourceLayer requires `sources` for URL/blob inputs.');
  }

  /** Copies a tileset option only when the layer prop was explicitly set. */
  private _assignTilesetOptionIfExplicit(
    options: Record<string, unknown>,
    key: string,
    value: unknown,
    defaultValue: unknown
  ): void {
    if (!this._isDefaultOptionValue(value, defaultValue)) {
      options[key] = value;
    }
  }

  /** Tests whether a layer prop still has its default value. */
  private _isDefaultOptionValue(value: unknown, defaultValue: unknown): boolean {
    if (Array.isArray(value) || Array.isArray(defaultValue)) {
      return (
        Array.isArray(value) &&
        Array.isArray(defaultValue) &&
        value.length === defaultValue.length &&
        value.every((entry, index) => entry === defaultValue[index])
      );
    }
    return value === defaultValue;
  }

  /** Normalizes nested render output into a flat tile sub-layer array. */
  private _flattenTileLayers(rendered: Layer | null | LayersList): any[] {
    return flatten(rendered as any, Boolean) as any[];
  }
}

/**
 * Default sublayer render callback for the shared raster/vector tile path.
 *
 * Renders vector tiles with `GeoJsonLayer`, image tiles with `BitmapLayer`, and
 * optional debug tile borders with `PathLayer`.
 */
function defaultRenderSubLayers<DataT>(
  props: Tile2DSourceLayerProps<DataT> & {
    id: string;
    data: DataT;
    _offset: number;
    tile: SharedTile2DHeader<DataT>;
    tileSource: TileSourceRuntime;
  }
) {
  const {tileSource, showTileBorders, minZoom, maxZoom, tile} = props;
  const {
    index: {z: zoom}
  } = tile;

  const layers: any[] = [];
  const resolvedMinZoom = minZoom ?? 0;
  const resolvedMaxZoom = maxZoom ?? 30;
  const borderColor =
    zoom <= resolvedMinZoom || zoom >= resolvedMaxZoom ? [255, 0, 0, 255] : [0, 0, 255, 255];

  switch (tileSource.mimeType) {
    case 'application/vnd.mapbox-vector-tile':
    case 'application/vnd.maplibre-tile':
      layers.push(
        new GeoJsonLayer(
          props as any,
          {
            id: `${props.id}-geojson`,
            data: props.data as any,
            pickable: true,
            autoHighlight: true,
            lineWidthScale: 500,
            lineWidthMinPixels: 0.5,
            getFillColor: [100, 120, 140, 255],
            highlightColor: [0, 0, 200, 255]
          } as any
        )
      );
      break;

    case 'image/png':
    case 'image/jpeg':
    case 'image/webp':
    case 'image/avif':
      if ('west' in tile.bbox) {
        layers.push(
          new BitmapLayer(
            props as any,
            {
              data: null as any,
              image: props.data,
              bounds: [tile.bbox.west, tile.bbox.south, tile.bbox.east, tile.bbox.north],
              pickable: true
            } as any
          )
        );
      }
      break;

    default:
      break;
  }

  if (showTileBorders && 'west' in tile.bbox) {
    layers.push(
      new PathLayer(
        props as any,
        {
          id: `${props.id}-border`,
          data: [
            {
              path: [
                [tile.bbox.west, tile.bbox.south],
                [tile.bbox.west, tile.bbox.north],
                [tile.bbox.east, tile.bbox.north],
                [tile.bbox.east, tile.bbox.south],
                [tile.bbox.west, tile.bbox.south]
              ]
            }
          ],
          getPath: (d: any) => d.path,
          getColor: borderColor as any,
          getWidth: 1,
          widthMinPixels: 1
        } as any
      )
    );
  }

  return layers;
}

function isTileSourceRuntime(value: unknown): value is TileSourceRuntime {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'getTileData' in value &&
      'getMetadata' in value &&
      !('initialize' in value)
  );
}
