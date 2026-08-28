// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  CoordinateSystem,
  Layer,
  LayerContext,
  LayersList,
  UpdateParameters,
  Viewport
} from '@deck.gl/core';
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {Tile3DLayer, type Tile3DLayerProps} from '@deck.gl/geo-layers';
import type {DataSourceOptions, Loader, SourceLoader} from '@loaders.gl/loader-utils';
import type {
  PointCloudTile,
  PointCloudTileset,
  PointCloudTilesetOptions,
  PointCloudTilesetSource
} from '@loaders.gl/tiles';
import {PointCloudTileset as PointCloudTilesetManager} from '@loaders.gl/tiles';
import {MeshArrowPointCloudLayer} from './mesh-arrow-point-cloud-layer';
import {
  finalizeOwnedSource,
  resolveVisualSource,
  type ResolvedVisualSource
} from './source-layer-utils';
import {TileBoundingBoxLayer} from './tile-bounding-box-layer';

/** Props for {@link PointCloudSourceLayer}. */
export type PointCloudSourceLayerProps = Omit<Tile3DLayerProps, 'data' | 'loader' | 'loaders'> & {
  /** Point-cloud tileset source runtime, URL, or Blob. */
  data: PointCloudTilesetSource | string | Blob;
  /** Parser loaders and SourceLoaders used to resolve URL/Blob inputs. */
  loaders?: ReadonlyArray<Loader | SourceLoader>;
  /** @deprecated Put SourceLoaders in `loaders`. */
  sources?: Readonly<SourceLoader[]>;
  /** Options forwarded to source construction. */
  sourceOptions?: DataSourceOptions;
  /** Optional metadata already loaded by a parent SourceLayer. */
  metadata?: unknown;
  /** Point-cloud traversal and request options. */
  pointCloudTilesetOptions?: Partial<PointCloudTilesetOptions>;
  /** Called after the point-cloud tileset manager is created. */
  onPointCloudTilesetLoad?: (tileset: PointCloudTileset) => void;
  /** Called after traversal or tile loading changes the tileset. */
  onPointCloudTilesetUpdate?: (tileset: PointCloudTileset) => void;
  /** Called when point-cloud tile content loads. */
  onPointCloudTileLoad?: (tile: PointCloudTile) => void;
  /** Called when point-cloud tile content fails. */
  onPointCloudTileError?: (tile: PointCloudTile, error: Error) => void;
  /** Render selected point-cloud tile bounding boxes for debugging. */
  showTileBoundingBoxes?: boolean;
  /** Called when URL/Blob resolution fails. */
  onSourceError?: (error: Error) => void;
};

/**
 * deck.gl layer backed by a normalized loaders.gl {@link PointCloudTilesetSource}.
 *
 * The adapter is source-format agnostic and currently supports COPC and Potree runtimes. It keeps
 * traversal in `@loaders.gl/tiles` and confines deck.gl-specific rendering to this layer.
 */
export class PointCloudSourceLayer extends Tile3DLayer<any, PointCloudSourceLayerProps> {
  /** deck.gl layer name used in debugging output. */
  static layerName = 'PointCloudSourceLayer';

  /** Synchronous data prop preserves URL/Blob inputs for source resolution. */
  static defaultProps = {
    ...Tile3DLayer.defaultProps,
    data: null,
    loaders: {type: 'array', compare: false, value: []},
    sources: {type: 'array', compare: false, value: []},
    sourceOptions: {type: 'object', compare: false, value: {}},
    pointCloudTilesetOptions: {type: 'object', compare: false, value: {}},
    showTileBoundingBoxes: false,
    onPointCloudTilesetLoad: {type: 'function', value: () => {}},
    onPointCloudTilesetUpdate: {type: 'function', value: () => {}},
    onPointCloudTileLoad: {type: 'function', value: () => {}},
    onPointCloudTileError: {type: 'function', value: () => {}},
    onSourceError: {type: 'function', value: () => {}}
  } as any;

  private resolutionId = 0;
  private resolvedSource: ResolvedVisualSource | null = null;

  /** Creates a point-cloud layer with mixed parser and source loader support. */
  constructor(props: PointCloudSourceLayerProps) {
    super(props as any);
  }

  /** Releases point-cloud traversal and layer-owned source resources. */
  finalizeState(context?: LayerContext): void {
    this.resolutionId++;
    if (this.internalState) {
      super.finalizeState(context as LayerContext);
    } else {
      // Allow isolated adapter tests to exercise cleanup without a Deck instance.
      (this.state.tileset3d as PointCloudTileset | null)?.destroy();
      this.state.tileset3d = null;
      this.state.layerMap = {};
    }
    if (this.resolvedSource?.owned) {
      void finalizeOwnedSource(this.resolvedSource.source);
    }
    this.resolvedSource = null;
  }

  /**
   * Keeps Tile3DLayer's tile filtering for tile-backed sublayers while allowing helper layers.
   */
  filterSubLayer(filterParameters: {
    layer: Layer;
    viewport: Viewport;
    cullRect?: unknown;
    isPicking?: boolean;
  }): boolean {
    if (!(filterParameters.layer.props as any).tile) {
      return true;
    }
    return super.filterSubLayer(filterParameters as any);
  }

  /** Resolves sources and updates traversal for changed viewports. */
  updateState({props, oldProps, changeFlags}: UpdateParameters<this>): void {
    if (
      changeFlags.dataChanged ||
      props.loaders !== oldProps.loaders ||
      props.sources !== oldProps.sources ||
      props.sourceOptions !== oldProps.sourceOptions
    ) {
      void this.resolveSource(props);
    }

    if (changeFlags.viewportChanged) {
      const {activeViewports} = this.state;
      if (Object.keys(activeViewports).length) {
        this.updateTileset(activeViewports);
        this.state.lastUpdatedViewports = activeViewports;
        this.state.activeViewports = {};
      }
    }

    if (changeFlags.propsChanged) {
      const {layerMap} = this.state;
      for (const key in layerMap) {
        layerMap[key].needsUpdate = true;
      }
    }
  }

  /** Renders selected point-cloud tiles through MeshArrowPointCloudLayer. */
  renderLayers(): Layer | null | LayersList {
    const {layerMap} = this.state;
    const tileset = this.state.tileset3d as PointCloudTileset | null;
    if (!tileset) {
      return null;
    }

    const pointCloudLayers = tileset.tiles
      .map(tile => {
        const layerCache = layerMap[tile.id] || {tile};
        layerMap[tile.id] = layerCache;
        let {layer} = layerCache;
        if (tile.selected) {
          if (!layer) {
            layer = this.makePointCloudLayer(tile);
          } else if (layerCache.needsUpdate) {
            layer = this.makePointCloudLayer(tile, layer);
            layerCache.needsUpdate = false;
          }
        }
        layerCache.layer = layer;
        return layer;
      })
      .filter(Boolean);

    if (!this.props.showTileBoundingBoxes) {
      return pointCloudLayers;
    }

    return [
      ...pointCloudLayers,
      new TileBoundingBoxLayer({
        id: `${this.id}-tile-bounding-boxes`,
        tiles: tileset.tiles,
        selectedOnly: true,
        coordinateSystem: getTileBoundingBoxCoordinateSystem(tileset.tiles)
      })
    ];
  }

  private async resolveSource(props: PointCloudSourceLayerProps): Promise<void> {
    const resolutionId = ++this.resolutionId;
    const previousSource = this.resolvedSource;
    try {
      const resolvedSource = await resolveVisualSource(props);
      if (resolvedSource.sourceType !== 'point-cloud') {
        if (resolvedSource.owned) {
          await finalizeOwnedSource(resolvedSource.source);
        }
        throw new Error(
          `PointCloudSourceLayer expected a point-cloud source but resolved ${resolvedSource.sourceType}.`
        );
      }
      if (resolutionId !== this.resolutionId) {
        if (resolvedSource.owned) {
          await finalizeOwnedSource(resolvedSource.source);
        }
        return;
      }
      if (previousSource?.owned && previousSource.source !== resolvedSource.source) {
        await finalizeOwnedSource(previousSource.source);
      }
      this.resolvedSource = resolvedSource;
      this.loadTileset(resolvedSource.source as PointCloudTilesetSource);
    } catch (error) {
      if (resolutionId === this.resolutionId) {
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        this.props.onSourceError?.(normalizedError);
        this.raiseError(normalizedError, 'resolving point-cloud source');
      }
    }
  }

  /** Creates a tileset manager for the supplied source. */
  private loadTileset(dataSource: PointCloudTilesetSource): void {
    (this.state.tileset3d as PointCloudTileset | null)?.destroy();
    const tileset = new PointCloudTilesetManager(dataSource, {
      ...this.props.pointCloudTilesetOptions,
      onTileLoad: tile => this.handleTileLoad(tile),
      onTileError: (tile, error) => this.handleTileError(tile, error),
      onUpdate: () => this.handleTilesetUpdate()
    });

    this.setState({tileset3d: tileset, layerMap: {}});
    this.updateTileset(this.state.activeViewports);
    this.props.onPointCloudTilesetLoad?.(tileset);
    this.props.onPointCloudTilesetUpdate?.(tileset);
  }

  /** Refreshes selection for current deck.gl viewports. */
  private updateTileset(viewports: Record<string, Viewport> | null): void {
    if (!viewports) {
      return;
    }
    const tileset = this.state.tileset3d as PointCloudTileset | null;
    if (!this.context.timeline || !Object.keys(viewports).length || !tileset) {
      return;
    }
    void tileset.selectTiles(Object.values(viewports)).then(frameNumber => {
      if (this.state.frameNumber !== frameNumber) {
        this.setState({frameNumber});
      }
      this.props.onPointCloudTilesetUpdate?.(tileset);
      this.setNeedsUpdate();
    });
  }

  private handleTileLoad(tile: PointCloudTile): void {
    const tileset = this.state.tileset3d as PointCloudTileset | null;
    this.props.onPointCloudTileLoad?.(tile);
    if (tileset) {
      this.props.onPointCloudTilesetUpdate?.(tileset);
    }
    this.setNeedsUpdate();
  }

  private handleTileError(tile: PointCloudTile, error: Error): void {
    const tileset = this.state.tileset3d as PointCloudTileset | null;
    this.props.onPointCloudTileError?.(tile, error);
    if (tileset) {
      this.props.onPointCloudTilesetUpdate?.(tileset);
    }
    this.setNeedsUpdate();
  }

  private handleTilesetUpdate(): void {
    const tileset = this.state.tileset3d as PointCloudTileset | null;
    if (tileset) {
      this.props.onPointCloudTilesetUpdate?.(tileset);
    }
    this.setNeedsUpdate();
  }

  private makePointCloudLayer(
    tile: PointCloudTile,
    oldLayer?: MeshArrowPointCloudLayer
  ): MeshArrowPointCloudLayer | null {
    if (!tile.content) {
      return null;
    }
    const {
      constantRGBA,
      cartographicOrigin,
      modelMatrix,
      coordinateSystem = COORDINATE_SYSTEM.METER_OFFSETS
    } = tile.content;
    const data = oldLayer?.props.data || tile.content.data;
    if (!data) {
      return null;
    }
    const SubLayerClass = this.getSubLayerClass('pointcloud', MeshArrowPointCloudLayer);
    return new SubLayerClass({
      ...this.getSubLayerProps({id: 'pointcloud'}),
      id: `${this.id}-pointcloud-${tile.id}`,
      tile,
      data,
      coordinateSystem,
      coordinateOrigin:
        coordinateSystem === COORDINATE_SYSTEM.CARTESIAN ? undefined : cartographicOrigin,
      modelMatrix,
      defaultPointColor: (constantRGBA || this.props.getPointColor) as [number, number, number],
      pointCloudLayerProps: {
        pickable: true,
        pointSize: this.props.pointSize,
        parameters: {depthTest: false}
      }
    });
  }
}

function getTileBoundingBoxCoordinateSystem(tiles: PointCloudTile[]): CoordinateSystem {
  const tileWithContent = tiles.find(tile => tile.content?.coordinateSystem !== undefined);
  return tileWithContent?.content?.coordinateSystem === COORDINATE_SYSTEM.CARTESIAN
    ? COORDINATE_SYSTEM.CARTESIAN
    : COORDINATE_SYSTEM.LNGLAT;
}
