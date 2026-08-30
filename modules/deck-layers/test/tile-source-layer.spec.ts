// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {TileSourceLayer, type TileSourceRuntime} from '../src/tile-source-layer';

/** Creates a minimal tile source with a configurable MIME type. */
function createSource(mimeType: string, localCoordinates = false): TileSourceRuntime {
  return {
    mimeType,
    localCoordinates,
    url: `memory://${mimeType}`,
    options: {},
    async getMetadata() {
      return {};
    },
    async getTileData(parameters) {
      return {parameters};
    }
  } as TileSourceRuntime;
}

/** Creates a layer with a deterministic canvas context. */
function createLayer(source: TileSourceRuntime, props: Record<string, unknown> = {}) {
  const layer = new TileSourceLayer({id: 'tiles', data: source, ...props} as any) as any;
  layer.context = {
    device: {getCanvasContext: () => ({getDevicePixelRatio: () => 1})}
  };
  layer.state = {};
  layer.setState = (update: Record<string, unknown>) => Object.assign(layer.state, update);
  layer.initializeState();
  layer.updateState({props: layer.props});
  return layer;
}

describe('TileSourceLayer', () => {
  test('initializes and returns null before a source is installed', () => {
    const layer = new TileSourceLayer({id: 'empty', data: createSource('image/png')} as any) as any;
    layer.state = {};
    layer.setState = (update: Record<string, unknown>) => Object.assign(layer.state, update);
    layer.initializeState();
    expect(layer.renderLayers()).toBeNull();
  });

  test('renders local vector sources through the MVT adapter', async () => {
    const source = createSource('application/vnd.mapbox-vector-tile', true);
    const onTileError = vi.fn();
    const layer = createLayer(source, {
      metadata: {minZoom: 2, maxZoom: 8},
      showTileBorders: false,
      onTileError
    });
    const [mvtLayer] = layer.renderLayers();

    expect(source.options.table?.coordinates).toBe('local');
    expect(layer.sourceSupportsMVTLayer()).toBe(true);
    expect(mvtLayer.props).toMatchObject({minZoom: 2, maxZoom: 8, zoomOffset: -1});
    mvtLayer.state = {vectorTileSource: source};
    await expect(mvtLayer.getTileData({index: {x: 1, y: 2, z: 3}})).resolves.toEqual({
      parameters: {index: {x: 1, y: 2, z: 3}}
    });

    const failedSource = {
      ...source,
      getTileData: vi.fn(async () => Promise.reject(new Error('tile')))
    };
    mvtLayer.state = {vectorTileSource: failedSource};
    await expect(mvtLayer.getTileData({index: {x: 0, y: 0, z: 0}})).resolves.toBeNull();
    expect(onTileError).toHaveBeenCalledOnce();
    mvtLayer.state = {vectorTileSource: null};
    await expect(mvtLayer.getTileData({})).resolves.toBeNull();
  });

  test.each([
    ['application/vnd.mapbox-vector-tile', 'GeoJsonLayer'],
    ['application/vnd.maplibre-tile', 'GeoJsonLayer'],
    ['image/png', 'BitmapLayer'],
    ['image/jpeg', 'BitmapLayer'],
    ['image/webp', 'BitmapLayer'],
    ['image/avif', 'BitmapLayer']
  ])('renders %s sublayers as %s', async (mimeType, expectedLayerName) => {
    const source = createSource(mimeType);
    const layer = createLayer(source, {metadata: {minZoom: 1, maxZoom: 9}, showTileBorders: true});
    const [tileLayer] = layer.renderLayers();

    expect(source.options.table?.coordinates).toBe('wgs84');
    expect(layer.sourceSupportsMVTLayer()).toBe(false);
    expect(tileLayer.props).toMatchObject({minZoom: 1, maxZoom: 9, zoomOffset: -1});
    await expect(tileLayer.props.getTileData({index: {x: 1, y: 2, z: 3}})).resolves.toEqual({
      parameters: {index: {x: 1, y: 2, z: 3}}
    });
    const sublayers = tileLayer.props.renderSubLayers({
      id: 'tile',
      data: {image: true},
      tileSource: source,
      showTileBorders: true,
      minZoom: 1,
      maxZoom: 9,
      tile: {index: {z: 1}, bbox: {west: 0, south: 1, east: 2, north: 3}}
    });
    expect(sublayers[0].constructor.layerName).toBe(expectedLayerName);
    expect(sublayers[1].constructor.layerName).toBe('PathLayer');
    expect(sublayers[1].props.getColor).toEqual([255, 0, 0, 255]);
  });

  test('forwards generic tile errors and handles unknown MIME types', async () => {
    const error = new Error('failed');
    const source = createSource('application/unknown');
    source.getTileData = vi.fn(async () => Promise.reject(error));
    const onTileError = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const layer = createLayer(source, {onTileError});
    const [tileLayer] = layer.renderLayers();

    await expect(tileLayer.props.getTileData({index: {x: 0, y: 0, z: 0}})).resolves.toBeNull();
    expect(onTileError).toHaveBeenCalledWith(error, expect.any(Object));
    const sublayers = tileLayer.props.renderSubLayers({
      id: 'unknown',
      data: null,
      tileSource: source,
      showTileBorders: false,
      tile: {index: {z: 5}, bbox: {west: 0, south: 0, east: 1, north: 1}}
    });
    expect(sublayers).toEqual([]);
    expect(consoleError).toHaveBeenCalledWith('Unknown tile mimeType', 'application/unknown');
    consoleError.mockRestore();
  });
});
