// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Tile3DLayer} from '@deck.gl/geo-layers';
import {TILE_TYPE} from '@loaders.gl/tiles';
import {afterEach, expect, test, vi} from 'vitest';
import {DataDrivenTile3DLayer} from '../src/data-driven-tile-3d-layer';

/** Creates an isolated layer whose state updates do not require a Deck instance. */
function createLayer(props: Record<string, unknown> = {}) {
  const layer = new DataDrivenTile3DLayer({
    id: 'data-driven',
    data: null,
    loader: {},
    ...props
  } as any) as any;
  layer.state = {
    activeViewports: {},
    lastUpdatedViewports: null,
    layerMap: {},
    tileset3d: null,
    colorsByAttribute: null,
    filtersByAttribute: null,
    loadingCounter: 0
  };
  layer.setState = (update: Record<string, unknown>) => Object.assign(layer.state, update);
  layer.setNeedsUpdate = vi.fn();
  return layer;
}

/** Flushes callbacks attached to already-settled promises. */
async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

afterEach(() => vi.restoreAllMocks());

test('data-driven traversal applies color and filter hooks to mesh tiles', async () => {
  vi.spyOn(Tile3DLayer.prototype as any, '_updateTileset').mockImplementation(() => {});
  const customizeColors = vi
    .fn()
    .mockResolvedValueOnce({id: 'changed', isColored: true})
    .mockRejectedValueOnce(new Error('ignored'));
  const filterTile = vi
    .fn()
    .mockResolvedValueOnce({id: 'unchanged', isFiltered: false})
    .mockResolvedValueOnce({id: 'changed', isFiltered: true});
  const onTraversalComplete = vi.fn(tiles => tiles.slice(0, 1));
  const layer = createLayer({customizeColors, filterTile, onTraversalComplete});
  layer.state.colorsByAttribute = {attributeName: 'height'};
  layer.state.filtersByAttribute = {attributeName: 'height'};
  layer.state.layerMap = {changed: {cached: true}, unchanged: {cached: true}};
  const tiles = [
    {id: 'changed', type: TILE_TYPE.MESH},
    {id: 'unchanged', type: TILE_TYPE.MESH}
  ];

  expect(layer._onTraversalComplete(tiles)).toEqual([tiles[0]]);
  expect(layer.state.loadingCounter).toBe(2);
  await flushPromises();

  expect(customizeColors).toHaveBeenCalledTimes(2);
  expect(filterTile).toHaveBeenCalledTimes(2);
  expect(layer.state.layerMap.changed).toBeUndefined();
  expect(layer.state.layerMap.unchanged).toEqual({cached: true});
  expect(layer.state.loadingCounter).toBe(0);
  expect(layer.setNeedsUpdate).toHaveBeenCalled();
});

test('data-driven hooks skip non-mesh tiles and default traversal returns its input', () => {
  const customizeColors = vi.fn();
  const filterTile = vi.fn();
  const layer = createLayer({customizeColors, filterTile});
  const tiles = [{id: 'point', type: TILE_TYPE.POINTCLOUD}];

  expect(layer._onTraversalComplete(tiles)).toBe(tiles);
  expect(customizeColors).not.toHaveBeenCalled();
  expect(filterTile).not.toHaveBeenCalled();
});

test('data-driven tileset-wide hooks and tile loads cover empty and populated state', () => {
  const updateTileset = vi
    .spyOn(Tile3DLayer.prototype as any, '_updateTileset')
    .mockImplementation(() => {});
  const onTileLoad = vi.fn();
  const layer = createLayer({onTileLoad});
  layer._colorizeTiles = vi.fn();
  layer._filterTiles = vi.fn();

  layer._colorizeTileset();
  layer._filterTileset();
  expect(layer._colorizeTiles).not.toHaveBeenCalled();

  const tiles = [{id: 'mesh', type: TILE_TYPE.MESH}];
  layer.state.tileset3d = {selectedTiles: tiles};
  layer._colorizeTileset();
  layer._filterTileset();
  expect(layer._colorizeTiles).toHaveBeenCalledWith(tiles);
  expect(layer._filterTiles).toHaveBeenCalledWith(tiles);

  layer.state.lastUpdatedViewports = {main: {}};
  layer._onTileLoad(tiles[0]);
  expect(onTileLoad).toHaveBeenCalledWith(tiles[0]);
  expect(updateTileset).toHaveBeenCalledWith(layer.state.lastUpdatedViewports);
  expect(layer.setNeedsUpdate).toHaveBeenCalled();

  layer.state.colorsByAttribute = {attributeName: 'height'};
  updateTileset.mockClear();
  layer._onTileLoad(tiles[0]);
  expect(updateTileset).not.toHaveBeenCalled();
});

test('data-driven updateState handles data, styling, viewport, loading, and fallback updates', () => {
  const updateTileset = vi
    .spyOn(Tile3DLayer.prototype as any, '_updateTileset')
    .mockImplementation(() => {});
  const updateBaseState = vi
    .spyOn(Tile3DLayer.prototype as any, 'updateState')
    .mockImplementation(() => {});
  const layer = createLayer();
  layer._loadTileset = vi.fn();
  layer._colorizeTileset = vi.fn();
  layer._filterTileset = vi.fn();

  layer.updateState({
    props: {...layer.props, data: 'tileset.json'},
    oldProps: {...layer.props, data: null},
    changeFlags: {}
  });
  expect(layer._loadTileset).toHaveBeenCalledWith('tileset.json');

  const colorsByAttribute = {attributeName: 'height'};
  layer.updateState({
    props: {...layer.props, colorsByAttribute},
    oldProps: {...layer.props, colorsByAttribute: null},
    changeFlags: {}
  });
  expect(layer.state.colorsByAttribute).toBe(colorsByAttribute);
  expect(layer._colorizeTileset).toHaveBeenCalled();

  const filtersByAttribute = {attributeName: 'height'};
  layer.updateState({
    props: {...layer.props, filtersByAttribute},
    oldProps: {...layer.props, filtersByAttribute: null},
    changeFlags: {}
  });
  expect(layer.state.filtersByAttribute).toBe(filtersByAttribute);
  expect(layer._filterTileset).toHaveBeenCalled();

  layer.state.activeViewports = {main: {id: 'main'}};
  layer.updateState({
    props: layer.props,
    oldProps: layer.props,
    changeFlags: {viewportChanged: true}
  });
  expect(updateTileset).toHaveBeenCalledWith({main: {id: 'main'}});
  expect(layer.state.activeViewports).toEqual({});

  updateTileset.mockClear();
  layer.state.activeViewports = {main: {id: 'main'}};
  layer.state.loadingCounter = 1;
  layer.updateState({
    props: layer.props,
    oldProps: layer.props,
    changeFlags: {viewportChanged: true}
  });
  expect(updateTileset).not.toHaveBeenCalled();

  layer.updateState({props: layer.props, oldProps: layer.props, changeFlags: {}});
  expect(updateBaseState).toHaveBeenCalled();
});
