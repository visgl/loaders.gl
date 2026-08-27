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
});
