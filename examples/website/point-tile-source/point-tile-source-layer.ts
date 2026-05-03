// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Layer, LayersList, UpdateParameters, Viewport} from '@deck.gl/core';
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {Tile3DLayer, type Tile3DLayerProps} from '@deck.gl/geo-layers';
import {MeshArrowPointCloudLayer, TileBoundingBoxLayer} from '@loaders.gl/deck-layers';
import type {
  PointCloudTile,
  PointCloudTileset,
  PointCloudTilesetOptions,
  PointCloudTilesetSource
} from '@loaders.gl/tiles';
import {PointCloudTileset as PointCloudTilesetManager} from '@loaders.gl/tiles';

/**
 * Additional props supported by the point-tile source layer.
 */
export type PointTileSourceLayerProps = {
  dataSource: PointCloudTilesetSource | null;
  pointTilesetOptions?: Partial<PointCloudTilesetOptions>;
  onPointTilesetLoad?: (tileset: PointCloudTileset) => void;
  onPointTilesetUpdate?: (tileset: PointCloudTileset) => void;
  onPointTileLoad?: (tile: PointCloudTile) => void;
  onPointTileError?: (tile: PointCloudTile, error: Error) => void;
  /** Render selected point-cloud tile bounding boxes for traversal debugging. */
  showTileBoundingBoxes?: boolean;
};

/**
 * A point-cloud-only deck.gl layer backed by `PointCloudTileset`.
 */
export class PointTileSourceLayer<
  DataT = unknown,
  ExtraProps extends {} = {}
> extends Tile3DLayer<DataT, Tile3DLayerProps & PointTileSourceLayerProps & ExtraProps> {
  static layerName = 'PointTileSourceLayer';
  static defaultProps = Tile3DLayer.defaultProps;

  /**
   * Keeps Tile3DLayer's tile filtering for tile-backed sublayers while allowing helper layers.
   */
  filterSubLayer(filterParameters: {layer: Layer; viewport: Viewport; cullRect?: unknown; isPicking?: boolean}): boolean {
    if (!filterParameters.layer.props.tile) {
      return true;
    }
    return super.filterSubLayer(filterParameters as any);
  }

  /**
   * Updates the backing point-cloud tileset when the source or viewport changes.
   */
  updateState({props, oldProps, changeFlags}: UpdateParameters<this>): void {
    if (props.dataSource !== oldProps.dataSource) {
      if (props.dataSource) {
        this.loadTileset(props.dataSource);
      } else {
        this.setState({tileset3d: null, layerMap: {}, frameNumber: undefined});
      }
    }

    if (changeFlags.viewportChanged) {
      const {activeViewports} = this.state;
      const viewportCount = Object.keys(activeViewports).length;
      if (viewportCount) {
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

  /**
   * Creates a tileset manager for the supplied source.
   */
  private loadTileset(dataSource: PointCloudTilesetSource): void {
    const tileset = new PointCloudTilesetManager(dataSource, {
      ...this.props.pointTilesetOptions,
      onTileLoad: (tile) => this.handleTileLoad(tile),
      onTileError: (tile, error) => this.handleTileError(tile, error),
      onUpdate: () => this.handleTilesetUpdate()
    });

    this.setState({
      tileset3d: tileset,
      layerMap: {}
    });

    this.updateTileset(this.state.activeViewports);
    this.props.onPointTilesetLoad?.(tileset);
    this.props.onPointTilesetUpdate?.(tileset);
  }

  /**
   * Refreshes the selection for the current deck.gl viewports.
   */
  private updateTileset(viewports: {[viewportId: string]: Viewport} | null): void {
    if (!viewports) {
      return;
    }

    const tileset3d = this.state.tileset3d as PointCloudTileset | null;
    const {timeline} = this.context;
    const viewportCount = Object.keys(viewports).length;
    if (!timeline || !viewportCount || !tileset3d) {
      return;
    }

    void tileset3d.selectTiles(Object.values(viewports)).then((frameNumber: number) => {
      if (this.state.frameNumber !== frameNumber) {
        this.setState({frameNumber});
      }
      this.props.onPointTilesetUpdate?.(tileset3d);
      this.setNeedsUpdate();
    });
  }

  /**
   * Handles point-tile content load completion.
   */
  private handleTileLoad(tile: PointCloudTile): void {
    const tileset3d = this.state.tileset3d as PointCloudTileset | null;
    this.props.onPointTileLoad?.(tile);
    if (tileset3d) {
      this.props.onPointTilesetUpdate?.(tileset3d);
    }
    this.setNeedsUpdate();
  }

  /**
   * Handles point-tile load failures.
   */
  private handleTileError(tile: PointCloudTile, error: Error): void {
    const tileset3d = this.state.tileset3d as PointCloudTileset | null;
    this.props.onPointTileError?.(tile, error);
    if (tileset3d) {
      this.props.onPointTilesetUpdate?.(tileset3d);
    }
    this.setNeedsUpdate();
  }

  /**
   * Handles tileset traversal updates.
   */
  private handleTilesetUpdate(): void {
    const tileset3d = this.state.tileset3d as PointCloudTileset | null;
    if (tileset3d) {
      this.props.onPointTilesetUpdate?.(tileset3d);
    }
    this.setNeedsUpdate();
  }

  /**
   * Converts a loaded point tile into a `MeshArrowPointCloudLayer`.
   */
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

    const {pointSize, getPointColor} = this.props;
    const SubLayerClass = this.getSubLayerClass('pointcloud', MeshArrowPointCloudLayer);

    return new SubLayerClass({
      ...this.getSubLayerProps({
        id: 'pointcloud'
      }),
      id: `${this.id}-pointcloud-${tile.id}`,
      tile,
      data,
      coordinateSystem,
      coordinateOrigin: coordinateSystem === COORDINATE_SYSTEM.CARTESIAN ? undefined : cartographicOrigin,
      modelMatrix,
      defaultPointColor: (constantRGBA || getPointColor) as [number, number, number],
      pointCloudLayerProps: {
        pickable: true,
        pointSize,
        parameters: {depthTest: false}
      }
    });
  }

  /**
   * Renders the selected point tiles.
   */
  renderLayers(): Layer | null | LayersList {
    const {layerMap} = this.state;
    const tileset3d = this.state.tileset3d as PointCloudTileset | null;
    if (!tileset3d) {
      return null;
    }

    const pointCloudLayers = tileset3d.tiles
      .map((tile: PointCloudTile) => {
        const layerCache = (layerMap[tile.id] = layerMap[tile.id] || {tile});
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
        tiles: tileset3d.tiles,
        selectedOnly: true,
        coordinateSystem: getTileBoundingBoxCoordinateSystem(tileset3d.tiles)
      })
    ];
  }
}

/**
 * Infers the coordinate system used by tile bounding volumes from loaded tile content.
 */
function getTileBoundingBoxCoordinateSystem(tiles: PointCloudTile[]): number {
  const tileWithContent = tiles.find((tile) => tile.content?.coordinateSystem !== undefined);
  return tileWithContent?.content?.coordinateSystem === COORDINATE_SYSTEM.CARTESIAN
    ? COORDINATE_SYSTEM.CARTESIAN
    : COORDINATE_SYSTEM.LNGLAT;
}
