// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Layer, LayersList, UpdateParameters, Viewport} from '@deck.gl/core';
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {PointCloudLayer} from '@deck.gl/layers';
import {Tile3DLayer, type Tile3DLayerProps} from '@deck.gl/geo-layers';
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
};

type PointTileSourceAttribute = {
  value: ArrayBufferView;
  size: number;
  normalized?: boolean;
};

type PointTileSourceLayerAttribute = PointTileSourceAttribute & {
  type?: string;
};

/**
 * Converts a source color attribute into a deck.gl attribute descriptor.
 */
function getPointCloudLayerColorAttribute(
  colors: PointTileSourceAttribute | undefined
): PointTileSourceLayerAttribute | undefined {
  if (!colors) {
    return undefined;
  }

  if (colors.value instanceof Uint16Array) {
    return {...colors, type: 'unorm16', normalized: true};
  }

  if (colors.value instanceof Uint8Array || colors.value instanceof Uint8ClampedArray) {
    return {...colors, type: 'unorm8', normalized: true};
  }

  return colors;
}

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
   * Converts a loaded point tile into a deck.gl `PointCloudLayer`.
   */
  private makePointCloudLayer(
    tile: PointCloudTile,
    oldLayer?: PointCloudLayer<DataT>
  ): PointCloudLayer<DataT> | null {
    if (!tile.content) {
      return null;
    }

    const {
      attributes,
      pointCount,
      constantRGBA,
      cartographicOrigin,
      modelMatrix,
      coordinateSystem = COORDINATE_SYSTEM.METER_OFFSETS
    } = tile.content;
    const {positions, normals, colors} = attributes;

    if (!positions) {
      return null;
    }

    const colorAttribute = getPointCloudLayerColorAttribute(colors);
    const data = (oldLayer && oldLayer.props.data) || {
      header: {
        vertexCount: pointCount
      },
      attributes: {
        POSITION: positions,
        NORMAL: normals,
        instanceColors: colorAttribute
      }
    };

    const {pointSize, getPointColor} = this.props;
    const SubLayerClass = this.getSubLayerClass('pointcloud', PointCloudLayer);

    return new SubLayerClass(
      {
        pointSize,
        parameters: {depthTest: false}
      },
      this.getSubLayerProps({
        id: 'pointcloud'
      }),
      {
        id: `${this.id}-pointcloud-${tile.id}`,
        tile,
        data,
        coordinateSystem,
        coordinateOrigin: coordinateSystem === COORDINATE_SYSTEM.CARTESIAN ? undefined : cartographicOrigin,
        modelMatrix,
        getColor: constantRGBA || getPointColor,
        _offset: 0
      }
    );
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

    return tileset3d.tiles
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
  }
}
