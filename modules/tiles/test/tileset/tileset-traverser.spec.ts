// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

import {expect, test, vi} from 'vitest';
import {radians} from '@math.gl/core';
import {TILE_REFINEMENT} from '../../src/constants';
import {WebMercatorViewport} from '@deck.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {coreApi} from '@loaders.gl/core';
import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';
import {TilesetTraverser} from '../../src/tileset-3d/common/tileset-traverser';
import {getFrameState} from '../../src/tileset-3d/helpers/frame-state';
// Parent tile with content and four child tiles with content
const TILESET_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/Tileset/tileset.json';
test('Tileset3D#traverser base class', async () => {
  const source = new Tiles3DSource({url: TILESET_URL, loader: Tiles3DLoader, coreApi});
  const tileset = new Tileset3D(source);
  await tileset.tilesetInitializationPromise;
  expect(
    tileset.options.progressiveResolutionHeightFraction,
    'uses the progressive-resolution default'
  ).toBe(0.3);
  expect(tileset.options.foveatedScreenSpaceError, 'enables foveated priority by default').toBe(
    true
  );
  expect(tileset.options.foveatedTimeDelay, 'uses the moving-camera delay default').toBe(0.2);
  const traverser = new TilesetTraverser({
    basePath: tileset.basePath,
    onTraversalEnd: traversalEnd
  });
  const viewport = new WebMercatorViewport({
    altitude: 1.5,
    bearing: 0,
    far: 1000,
    fovy: 50,
    height: 600,
    id: 'view0',
    latitude: 40.049483884253355,
    longitude: -75.60783109310839,
    maxPitch: 85,
    maxZoom: 30,
    minPitch: 0,
    minZoom: 2,
    modelMatrix: null,
    near: 0.1,
    pitch: 45,
    projectionMatrix: null,
    width: 1848,
    zoom: 12.660812211760435
  });
  traverser.traverse(tileset.root, getFrameState(viewport, 0), {});
  function traversalEnd() {
    expect(traverser).toBeTruthy();
  }
});

test('TilesetTraverser#does not request replacement children outside viewer request volumes', () => {
  const traverser = new TilesetTraverser({});
  let requested = 0;
  traverser.loadTile = () => {
    requested++;
  };
  const child = {
    _inRequestVolume: false,
    isVisibleAndInRequestVolume: false,
    hasRenderContent: true,
    contentAvailable: false,
    children: [],
    parent: null
  } as any;
  const parent = {
    refine: 'REPLACE',
    hasRenderContent: true,
    children: [child],
    tileset: {},
    _selectionDepth: 1
  } as any;
  child.parent = parent;

  const shouldRefine = traverser.updateAndPushChildren(parent, {} as any, [], 2);

  expect(shouldRefine, 'does not refine through an out-of-volume child').toBe(false);
  expect(
    requested,
    'does not issue an off-volume request while checking replacement coverage'
  ).toBe(0);
});

test('TilesetTraverser#keeps external tileset traversal available until expiration', () => {
  const traverser = new TilesetTraverser({});
  traverser.shouldRefine = () => false;
  const externalTile = {
    hasChildren: true,
    hasTilesetContent: true,
    contentExpired: false
  } as any;

  expect(
    traverser.canTraverse(externalTile, {} as any),
    'visits an external tileset root while its content is current'
  ).toBe(true);
  externalTile.contentExpired = true;
  expect(
    traverser.canTraverse(externalTile, {} as any),
    'stops traversing an expired external tileset until it is refreshed'
  ).toBe(false);
});

test('TilesetTraverser#does not require all children for additive refinement', () => {
  const traverser = new TilesetTraverser({});
  const child = {
    _inRequestVolume: true,
    isVisibleAndInRequestVolume: true,
    hasRenderContent: true,
    contentAvailable: false,
    children: [],
    parent: null
  } as any;
  const parent = {
    refine: 'ADD',
    hasRenderContent: true,
    children: [child],
    tileset: {},
    _selectionDepth: 1
  } as any;
  child.parent = parent;

  const stack = {find: () => false, delete: () => {}, push: () => {}} as any;
  const shouldRefine = traverser.updateAndPushChildren(parent, {} as any, stack, 2);

  expect(shouldRefine, 'additive refinement can continue while child content streams').toBe(true);
});

test('Tileset3D selects elevated content after the render camera moves above it', async () => {
  const region = [
    radians(8.53908),
    radians(47.36858),
    radians(8.53912),
    radians(47.36862),
    405,
    438
  ];
  const source = new Tiles3DSource({
    shape: 'tileset3d',
    type: 'TILES3D',
    url: '/elevated/tileset.json',
    loader: Tiles3DLoader,
    coreApi,
    asset: {version: '1.0'},
    lodMetricType: 'geometricError',
    lodMetricValue: 100,
    root: {
      id: 'root',
      refine: TILE_REFINEMENT.ADD,
      boundingVolume: {region},
      lodMetricType: 'geometricError',
      lodMetricValue: 100,
      children: [
        {
          id: 'building',
          refine: TILE_REFINEMENT.ADD,
          boundingVolume: {region},
          contentUrl: '/elevated/building.b3dm',
          lodMetricType: 'geometricError',
          lodMetricValue: 0
        }
      ]
    }
  });
  const loadContent = vi.spyOn(source, 'loadTileContent').mockResolvedValue({
    loaded: true,
    contents: [{type: 'b3dm', vertexCount: 3}]
  });
  const onTileLoad = vi.fn();
  const tileset = new Tileset3D(source, {debounceTime: 0, foveatedTimeDelay: 0, onTileLoad});
  const viewportOptions = {
    id: 'zurich',
    longitude: 8.5391,
    latitude: 47.3686,
    width: 898,
    height: 320,
    zoom: 17,
    pitch: 0,
    bearing: 0
  };
  try {
    await tileset.selectTiles(new WebMercatorViewport(viewportOptions));
    expect(loadContent).not.toHaveBeenCalled();
    expect(tileset.selectedTiles).toHaveLength(0);
    const root = tileset.roots.zurich;
    const elevatedViewport = new WebMercatorViewport({...viewportOptions, position: [0, 0, 405]});
    await tileset.selectTiles(elevatedViewport);
    await vi.waitFor(() => expect(onTileLoad).toHaveBeenCalledTimes(1));
    await tileset.selectTiles(elevatedViewport);
    expect(tileset.roots.zurich).toBe(root);
    expect(loadContent).toHaveBeenCalledTimes(1);
    expect(tileset.selectedTiles.map(tile => tile.id)).toEqual(['building']);
    expect(
      tileset.selectedTiles[0].distanceToTile(getFrameState(elevatedViewport, 3))
    ).toBeGreaterThan(150);
    await tileset.selectTiles(new WebMercatorViewport(viewportOptions));
    expect(tileset.selectedTiles).toHaveLength(0);
  } finally {
    tileset.destroy();
    loadContent.mockRestore();
  }
});
