// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {describe, expect, test, vi} from 'vitest';
import {PointCloudSourceLayer} from '@loaders.gl/deck-layers';
import type {PointCloudTilesetSource} from '@loaders.gl/tiles';

const ROOT_BOUNDING_VOLUME = {
  cartographicBounds: [
    [-1, -1, 0],
    [1, 1, 100]
  ] as [number[], number[]],
  center: [0, 0, 50],
  radius: 100
};

function createPointCloudSource(): PointCloudTilesetSource {
  return {
    options: {},
    isReady: false,
    async initialize() {
      this.isReady = true;
    },
    async getMetadata() {
      return {
        name: 'point cloud',
        boundingBox: [
          [-1, -1],
          [1, 1]
        ]
      };
    },
    async getRootTile() {
      return {
        id: 'root',
        level: 0,
        pointCount: 1,
        geometricError: 1,
        boundingVolume: ROOT_BOUNDING_VOLUME
      };
    },
    async getChildren() {
      return [];
    },
    async loadTileContent() {
      return null;
    },
    getViewState() {
      return {cartographicCenter: [0, 0, 50], zoom: 12, boundingVolume: ROOT_BOUNDING_VOLUME};
    }
  } as PointCloudTilesetSource;
}

function createLayer(source: PointCloudTilesetSource): PointCloudSourceLayer & Record<string, any> {
  const layer = new PointCloudSourceLayer({
    id: 'points',
    data: source
  } as any) as PointCloudSourceLayer & Record<string, any>;
  layer.state = {
    tileset3d: null,
    layerMap: {},
    activeViewports: {},
    lastUpdatedViewports: {},
    frameNumber: 0
  };
  layer.context = {} as any;
  layer.setState = ((state: Record<string, unknown>) => Object.assign(layer.state, state)) as any;
  layer.setNeedsUpdate = vi.fn();
  layer.raiseError = vi.fn();
  return layer;
}

describe('PointCloudSourceLayer', () => {
  test('initializes a point-cloud tileset and forwards lifecycle callbacks', async () => {
    const source = createPointCloudSource();
    const onPointCloudTilesetLoad = vi.fn();
    const onPointCloudTilesetUpdate = vi.fn();
    const layer = createLayer(source);
    layer.props = {
      ...layer.props,
      onPointCloudTilesetLoad,
      onPointCloudTilesetUpdate
    };

    await layer.resolveSource(layer.props);
    await layer.state.tileset3d.tilesetInitializationPromise;

    expect(source.isReady).toBe(true);
    expect(layer.state.tileset3d.root.id).toBe('root');
    expect(layer.state.tileset3d.zoom).toBe(12);
    expect(onPointCloudTilesetLoad).toHaveBeenCalledOnce();
    expect(onPointCloudTilesetUpdate).toHaveBeenCalledOnce();
  });

  test('renders selected tile content and optional bounding boxes', () => {
    const source = createPointCloudSource();
    const layer = createLayer(source);
    const tile = {
      id: 'root',
      selected: true,
      content: {
        data: {shape: 'mesh', attributes: {}, indices: null, mode: 0},
        pointCount: 1,
        cartographicOrigin: [0, 0, 0],
        coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
        constantRGBA: [10, 20, 30, 255]
      }
    };
    layer.state.tileset3d = {tiles: [tile]};
    layer.props = {...layer.props, extensions: [], showTileBoundingBoxes: true};

    const renderedLayers = layer.renderLayers() as any[];

    expect(renderedLayers[0].constructor.layerName).toBe('MeshArrowPointCloudLayer');
    expect(renderedLayers[0].props.defaultPointColor).toEqual([10, 20, 30, 255]);
    expect(renderedLayers[1].constructor.layerName).toBe('TileBoundingBoxLayer');
  });

  test('reports non-point source resolution errors', async () => {
    const tileSource = {
      mimeType: 'image/png',
      options: {},
      async getMetadata() {
        return {};
      },
      async getTileData() {
        return null;
      }
    };
    const onSourceError = vi.fn();
    const layer = createLayer(tileSource as any);
    layer.props = {...layer.props, data: tileSource, onSourceError};

    await layer.resolveSource(layer.props);

    expect(onSourceError).toHaveBeenCalledWith(
      expect.objectContaining({message: expect.stringContaining('expected a point-cloud source')})
    );
    expect(layer.raiseError).toHaveBeenCalledOnce();
  });

  test('releases traversal state on finalization', async () => {
    const layer = createLayer(createPointCloudSource());
    await layer.resolveSource(layer.props);
    await layer.state.tileset3d.tilesetInitializationPromise;
    const tileset = layer.state.tileset3d;

    layer.finalizeState();

    expect(tileset.root).toBeNull();
    expect(tileset.tiles).toEqual([]);
  });

  test('updates traversal state and marks cached layers when props change', () => {
    const layer = createLayer(createPointCloudSource());
    const updateTileset = vi.fn();
    layer.updateTileset = updateTileset;
    layer.resolveSource = vi.fn();
    layer.state.activeViewports = {main: {id: 'main'}};
    layer.state.layerMap = {first: {}, second: {}};

    layer.updateState({
      props: {...layer.props, loaders: [{}]},
      oldProps: {...layer.props, loaders: []},
      changeFlags: {dataChanged: false, viewportChanged: true, propsChanged: true}
    });

    expect(layer.resolveSource).toHaveBeenCalledOnce();
    expect(updateTileset).toHaveBeenCalledWith({main: {id: 'main'}});
    expect(layer.state.lastUpdatedViewports).toEqual({main: {id: 'main'}});
    expect(layer.state.activeViewports).toEqual({});
    expect(layer.state.layerMap).toEqual({first: {needsUpdate: true}, second: {needsUpdate: true}});
  });

  test('renders selected tiles, refreshes cached layers, and skips incomplete content', () => {
    const layer = createLayer(createPointCloudSource());
    layer.props = {...layer.props, extensions: [], showTileBoundingBoxes: false};
    expect(layer.renderLayers()).toBeNull();

    const completeTile = {
      id: 'complete',
      selected: true,
      content: {
        data: {shape: 'mesh', attributes: {}, indices: null, mode: 0},
        pointCount: 1,
        cartographicOrigin: [0, 0, 0],
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN
      }
    };
    const emptyTile = {id: 'empty', selected: true, content: null};
    const unselectedTile = {id: 'unselected', selected: false, content: completeTile.content};
    layer.state.tileset3d = {tiles: [completeTile, emptyTile, unselectedTile]};

    const firstLayers = layer.renderLayers() as any[];
    expect(firstLayers).toHaveLength(1);
    expect(firstLayers[0].props.coordinateOrigin).toBeUndefined();
    layer.state.layerMap.complete.needsUpdate = true;
    const secondLayers = layer.renderLayers() as any[];
    expect(secondLayers).toHaveLength(1);
    expect(layer.state.layerMap.complete.needsUpdate).toBe(false);
  });

  test('selects tiles asynchronously and forwards tile lifecycle events', async () => {
    const source = createPointCloudSource();
    const onPointCloudTileLoad = vi.fn();
    const onPointCloudTileError = vi.fn();
    const onPointCloudTilesetUpdate = vi.fn();
    const layer = createLayer(source);
    layer.props = {
      ...layer.props,
      onPointCloudTileLoad,
      onPointCloudTileError,
      onPointCloudTilesetUpdate
    };
    const tile = {id: 'tile'};
    const tileset = {selectTiles: vi.fn(async () => 7)};
    layer.state.tileset3d = tileset;
    layer.context = {timeline: {getTime: () => 0}} as any;

    layer.updateTileset(null);
    layer.updateTileset({});
    layer.updateTileset({main: {id: 'main'}});
    await Promise.resolve();
    await Promise.resolve();
    expect(layer.state.frameNumber).toBe(7);
    expect(layer.setNeedsUpdate).toHaveBeenCalled();

    const error = new Error('tile failed');
    layer.handleTileLoad(tile);
    layer.handleTileError(tile, error);
    layer.handleTilesetUpdate();
    expect(onPointCloudTileLoad).toHaveBeenCalledWith(tile);
    expect(onPointCloudTileError).toHaveBeenCalledWith(tile, error);
    expect(onPointCloudTilesetUpdate).toHaveBeenCalledTimes(4);
  });

  test('finalizes isolated owned sources and permits non-tile helper layers', () => {
    const close = vi.fn(async () => {});
    const destroy = vi.fn();
    const layer = createLayer(createPointCloudSource());
    layer.state.tileset3d = {destroy};
    layer.state.layerMap = {tile: {}};
    layer.resolvedSource = {source: {close}, sourceType: 'point-cloud', owned: true};

    expect(layer.filterSubLayer({layer: {props: {}}} as any)).toBe(true);
    layer.finalizeState();

    expect(destroy).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
    expect(layer.state.tileset3d).toBeNull();
    expect(layer.state.layerMap).toEqual({});
  });
});
