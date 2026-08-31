// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {convertGeometryToWKB} from '@loaders.gl/gis';
import {Tile2DSourceLayer, type Tile2DSourceLayerProps} from '@loaders.gl/deck-layers';
import {ArrowTableBuilder} from '@loaders.gl/schema-utils';
const TEST_TILE_SOURCE = {
  mimeType: 'image/png',
  options: {},
  async getMetadata() {
    return {minZoom: 0, maxZoom: 1};
  },
  async getTileData() {
    return null;
  }
};
const TEST_SOURCE_FACTORY = {
  name: 'TestSource',
  id: 'test-source',
  module: 'test',
  version: '0.0.0',
  extensions: ['test'],
  mimeTypes: ['application/test'],
  type: 'tile',
  fromUrl: true,
  fromBlob: true,
  testURL: () => true,
  createDataSource() {
    return TEST_TILE_SOURCE as any;
  }
};
const ARROW_TILE = createArrowTile();
function createLayer(props: Tile2DSourceLayerProps = {id: 'test', data: TEST_TILE_SOURCE as any}) {
  return new Tile2DSourceLayer(props as any) as any;
}
test('Tile2DSourceLayer#resolves URL inputs with sources', () => {
  const layer = createLayer({
    id: 'test',
    data: 'https://example.com/tiles',
    sources: [TEST_SOURCE_FACTORY as any]
  });
  const resolvedData = layer._resolveData(layer.props);
  expect(resolvedData).toBe(TEST_TILE_SOURCE);
});
test('Tile2DSourceLayer#accepts direct TileSource inputs', () => {
  const layer = createLayer();
  const resolvedData = layer._resolveData(layer.props);
  expect(resolvedData).toBe(TEST_TILE_SOURCE);
});
test('Tile2DSourceLayer#detects local-coordinate MVT sources', () => {
  const layer = createLayer();
  expect(
    layer.sourceSupportsMVTLayer({
      ...TEST_TILE_SOURCE,
      mimeType: 'application/vnd.mapbox-vector-tile',
      localCoordinates: true
    })
  ).toBeTruthy();
  expect(layer.sourceSupportsMVTLayer(TEST_TILE_SOURCE)).toBeFalsy();
});
test('Tile2DSourceLayer#default render path creates GeoJsonLayer for vector tiles', () => {
  const layer = createLayer();
  const renderedLayers = (layer.props as any).renderSubLayers({
    ...layer.props,
    id: 'vector-tile',
    data: [],
    _offset: 0,
    tile: {
      index: {x: 0, y: 0, z: 0},
      bbox: {west: 0, south: 0, east: 1, north: 1},
      boundingBox: [
        [0, 0],
        [1, 1]
      ]
    },
    tileSource: {
      ...TEST_TILE_SOURCE,
      mimeType: 'application/vnd.mapbox-vector-tile'
    }
  });
  expect(renderedLayers[0].constructor.layerName).toBe('GeoJsonLayer');
});
test('Tile2DSourceLayer#default render path creates GeoJsonLayer for Arrow vector tiles', () => {
  const layer = createLayer();
  const renderedLayers = (layer.props as any).renderSubLayers({
    ...layer.props,
    id: 'arrow-vector-tile',
    data: ARROW_TILE,
    _offset: 0,
    showTileBorders: false,
    tile: {
      index: {x: 0, y: 0, z: 0},
      bbox: {west: 0, south: 0, east: 1, north: 1},
      boundingBox: [
        [0, 0],
        [1, 1]
      ]
    },
    tileSource: {
      ...TEST_TILE_SOURCE,
      mimeType: 'application/vnd.mapbox-vector-tile'
    }
  });
  expect(renderedLayers[0].constructor.layerName).toBe('GeoJsonLayer');
  expect(renderedLayers[0].props.data.shape, 'passes deck.gl binary feature data').toBe(
    'binary-feature-collection'
  );
});
test('Tile2DSourceLayer#default render path creates BitmapLayer for raster tiles', () => {
  const layer = createLayer();
  const renderedLayers = (layer.props as any).renderSubLayers({
    ...layer.props,
    id: 'raster-tile',
    data: {} as any,
    _offset: 0,
    tile: {
      index: {x: 0, y: 0, z: 0},
      bbox: {west: 0, south: 0, east: 1, north: 1},
      boundingBox: [
        [0, 0],
        [1, 1]
      ]
    },
    tileSource: TEST_TILE_SOURCE
  });
  expect(renderedLayers[0].constructor.layerName).toBe('BitmapLayer');
});

test('Tile2DSourceLayer initializes state and reports loaded tile sublayers', () => {
  const layer = createLayer();
  layer.context = {viewport: {id: 'main'}, device: createDevice()} as any;
  layer.initializeState();
  expect(layer.state.tilesetViews.size).toBe(0);
  expect(layer.isLoaded).toBe(false);
  expect(layer.shouldUpdateState({changeFlags: {somethingChanged: true}})).toBe(true);

  const selectedTile = {id: 'tile', isLoaded: true, content: {}};
  layer.state.tilesetViews.set('main', {selectedTiles: [selectedTile], isLoaded: true});
  layer.state.tileLayers.set('tile', [{isLoaded: true}]);
  expect(layer.isLoaded).toBe(true);
  layer.state.tileLayers.set('tile', [{isLoaded: false}]);
  expect(layer.isLoaded).toBe(false);
});

test('Tile2DSourceLayer enriches picking and forwards highlighting', () => {
  const layer = createLayer();
  const updateAutoHighlight = vi.fn();
  const sourceLayer = {props: {tile: {id: 'tile'}}, updateAutoHighlight} as any;
  expect(() => layer.getPickingInfo({info: {}, sourceLayer: null} as any)).toThrow('source layer');

  const unpicked = layer.getPickingInfo({info: {picked: false}, sourceLayer} as any);
  expect(unpicked.sourceTile.id).toBe('tile');
  expect(unpicked.tile).toBeUndefined();
  const picked = layer.getPickingInfo({info: {picked: true}, sourceLayer} as any);
  expect(picked.tile.id).toBe('tile');
  layer._updateAutoHighlight(picked);
  expect(updateAutoHighlight).toHaveBeenCalledWith(picked);
});

test('Tile2DSourceLayer renders and caches shared tile layers', () => {
  const layer = createLayer({
    id: 'shared',
    data: TEST_TILE_SOURCE as any,
    renderSubLayers: props => [null, {id: props.id} as any, [[{id: 'nested'} as any]] as any]
  });
  const tile = {id: '0-0-0', isLoaded: true, content: {value: 1}, index: {x: 0, y: 0, z: 0}};
  layer.state = {
    resolvedData: TEST_TILE_SOURCE,
    resolvedSource: null,
    tileset: {tiles: [tile]},
    tilesetViews: new Map(),
    isLoaded: false,
    frameNumbers: new Map(),
    tileLayers: new Map(),
    unsubscribeTilesetEvents: null
  };
  layer.getSubLayerProps = (props: any) => props;
  const firstRender = layer.renderLayers();
  expect(firstRender[0]).toHaveLength(2);
  expect(layer.state.tileLayers.get(tile.id)).toHaveLength(2);
  expect(layer.renderLayers()[0]).toBe(firstRender[0]);

  tile.isLoaded = false;
  tile.content = null as any;
  expect(layer.renderLayers()[0]).toBe(firstRender[0]);
  layer.state.resolvedData = null;
  expect(layer.renderLayers()).toBeNull();
});

test('Tile2DSourceLayer renders local MVT sources and forwards tile errors', async () => {
  const onTileError = vi.fn();
  const source = {
    ...TEST_TILE_SOURCE,
    mimeType: 'application/vnd.mapbox-vector-tile',
    localCoordinates: true,
    getTileData: vi.fn(async () => {
      throw new Error('tile failed');
    })
  };
  const layer = createLayer({
    id: 'mvt',
    data: source as any,
    metadata: {minZoom: 2, maxZoom: 8},
    onTileError
  });
  layer.context = {device: createDevice(2)} as any;
  layer.state = {resolvedData: source};
  const [mvtLayer] = layer.renderLayers();
  expect(mvtLayer.props.minZoom).toBe(2);
  expect(mvtLayer.props.maxZoom).toBe(8);
  expect(mvtLayer.props.zoomOffset).toBe(0);
  mvtLayer.state = {vectorTileSource: source};
  await expect(mvtLayer.getTileData({index: {x: 0, y: 0, z: 0}})).resolves.toBeNull();
  expect(onTileError).toHaveBeenCalledTimes(1);

  mvtLayer.state = {vectorTileSource: null};
  await expect(mvtLayer.getTileData({})).resolves.toBeNull();
  mvtLayer.setState = vi.fn();
  mvtLayer.updateState({
    props: {...mvtLayer.props, data: source},
    oldProps: mvtLayer.props,
    changeFlags: {dataChanged: true}
  });
  expect(mvtLayer.setState).toHaveBeenCalledWith({vectorTileSource: source, binary: false});
});

test('Tile2DSourceLayer derives explicit tileset options and metadata bounds', () => {
  const layer = createLayer({
    id: 'options',
    data: TEST_TILE_SOURCE as any,
    maxCacheSize: 12,
    maxCacheByteSize: 4096,
    maxRequests: 3,
    debounceTime: 25,
    metadata: {
      minZoom: 1,
      maxZoom: 9,
      boundingBox: [
        [-10, -5],
        [10, 5]
      ]
    }
  });
  layer.context = {device: createDevice(1)} as any;
  const options = layer._getTilesetOptions(TEST_TILE_SOURCE);
  expect(options).toMatchObject({
    maxCacheSize: 12,
    maxCacheByteSize: 4096,
    maxRequests: 3,
    debounceTime: 25,
    minZoom: 1,
    maxZoom: 9,
    extent: [-10, -5, 10, 5],
    zoomOffset: -1
  });
  expect(layer._isDefaultOptionValue([1, 2], [1, 2])).toBe(true);
  expect(layer._isDefaultOptionValue([1, 3], [1, 2])).toBe(false);
});

test('Tile2DSourceLayer manages tile events, views, filtering, and release', () => {
  const layer = createLayer({id: 'events', data: TEST_TILE_SOURCE as any, onTileError: vi.fn()});
  const setNeedsUpdate = vi.fn();
  const unsubscribe = vi.fn();
  const finalize = vi.fn();
  layer.setNeedsUpdate = setNeedsUpdate;
  layer.setState = (update: any) => Object.assign(layer.state, update);
  layer.state = {
    resolvedData: TEST_TILE_SOURCE,
    resolvedSource: null,
    tileset: {} as any,
    tilesetViews: new Map([['main', {finalize}]]),
    isLoaded: false,
    frameNumbers: new Map(),
    tileLayers: new Map([['tile', [{}]]]),
    unsubscribeTilesetEvents: unsubscribe
  };
  const tile = {id: 'tile'};
  layer._onTileLoad(tile);
  expect(setNeedsUpdate).toHaveBeenCalledTimes(1);
  layer.state.tileLayers.set('tile', [{}]);
  layer._onTileError(new Error('failed'), tile);
  expect(layer.props.onTileError).toHaveBeenCalled();
  layer.state.tileLayers.set('tile', [{}]);
  layer._onTileUnload(tile);
  expect(layer.state.tileLayers.has('tile')).toBe(false);

  layer.state.tileset = null;
  expect(layer.filterSubLayer({layer: {}})).toBe(true);
  expect(() => layer._getOrCreateTilesetView('missing')).toThrow('not initialized');
  layer._releaseTileset();
  expect(unsubscribe).toHaveBeenCalled();
  expect(finalize).toHaveBeenCalled();
  expect(layer.state.tileset).toBeNull();
});

test('Tile2DSourceLayer updates existing tilesets and viewport callbacks', () => {
  const onTilesLoad = vi.fn();
  const layer = createLayer({id: 'update', data: TEST_TILE_SOURCE as any, onTilesLoad});
  const selectedTiles = [{id: 'tile', isLoaded: true, content: null}];
  const view = {
    selectedTiles,
    isLoaded: true,
    update: vi.fn(() => 2),
    isTileVisible: vi.fn(() => true)
  };
  const tileset = {setOptions: vi.fn(), reloadAll: vi.fn()};
  layer.context = {viewport: {id: 'main'}, device: createDevice()} as any;
  layer.setState = (update: any) => Object.assign(layer.state, update);
  layer.state = {
    resolvedData: TEST_TILE_SOURCE,
    resolvedSource: null,
    tileset,
    tilesetViews: new Map([['main', view]]),
    isLoaded: false,
    frameNumbers: new Map([['main', 1]]),
    tileLayers: new Map(),
    unsubscribeTilesetEvents: null
  };
  layer._knownViewports = new Map([['main', layer.context.viewport]]);
  layer.updateTilesetForProps(TEST_TILE_SOURCE, false, {propsOrDataChanged: true});
  expect(tileset.setOptions).toHaveBeenCalled();
  expect(onTilesLoad).toHaveBeenCalledWith(selectedTiles);
  expect(layer.state.frameNumbers.get('main')).toBe(2);

  expect(layer.filterSubLayer({layer: {props: {tile: selectedTiles[0]}}, cullRect: {}})).toBe(true);
  expect(view.isTileVisible).toHaveBeenCalled();
});

test('Tile2DSourceLayer asynchronously resolves direct sources and reports invalid inputs', async () => {
  const layer = createLayer({id: 'resolve', data: TEST_TILE_SOURCE as any});
  layer.context = {viewport: {id: 'main'}, device: createDevice()} as any;
  layer.initializeState();
  layer.setState = (update: any) => Object.assign(layer.state, update);
  layer.updateTilesetForProps = vi.fn();

  layer.updateState({
    props: layer.props,
    oldProps: {...layer.props, data: null},
    changeFlags: {dataChanged: true}
  });
  await Promise.resolve();
  await Promise.resolve();

  expect(layer.state.resolvedData).toBe(TEST_TILE_SOURCE);
  expect(layer.updateTilesetForProps).toHaveBeenCalledWith(
    TEST_TILE_SOURCE,
    true,
    expect.objectContaining({propsOrDataChanged: true})
  );

  const onSourceError = vi.fn();
  const invalidLayer = createLayer({id: 'invalid', data: 42 as any, onSourceError});
  invalidLayer.context = {} as any;
  invalidLayer.initializeState();
  invalidLayer.raiseError = vi.fn();
  await invalidLayer.resolveTileSource(invalidLayer.props);
  expect(onSourceError).toHaveBeenCalledWith(expect.any(Error));
  expect(invalidLayer.raiseError).toHaveBeenCalledWith(
    expect.any(Error),
    'resolving 2D tile source'
  );
});

test('Tile2DSourceLayer finalizes owned sources and rejects incompatible source types', async () => {
  const close = vi.fn(async () => {});
  const source = {...TEST_TILE_SOURCE, close};
  const sourceLoader = {
    ...TEST_SOURCE_FACTORY,
    createDataSource: () => source
  };
  const layer = createLayer({
    id: 'owned-tile-source',
    data: 'memory.test',
    sources: [sourceLoader as any]
  });
  layer.context = {device: createDevice()} as any;
  layer.initializeState();
  layer.setState = (update: any) => Object.assign(layer.state, update);
  layer.updateTilesetForProps = vi.fn();
  await layer.resolveTileSource(layer.props);
  layer.context = null;
  layer.finalizeState({} as any);
  await Promise.resolve();
  expect(close).toHaveBeenCalledOnce();

  const onSourceError = vi.fn();
  const incompatibleLayer = createLayer({
    id: 'incompatible-tile-source',
    data: {
      async getMetadata() {
        return {width: 1, height: 1, bandCount: 1, dtype: 'uint8'};
      },
      async getRaster() {
        return {data: new Uint8Array([1]), width: 1, height: 1, bandCount: 1, dtype: 'uint8'};
      }
    } as any,
    onSourceError
  });
  incompatibleLayer.context = {} as any;
  incompatibleLayer.initializeState();
  incompatibleLayer.raiseError = vi.fn();
  await incompatibleLayer.resolveTileSource(incompatibleLayer.props);
  expect(onSourceError).toHaveBeenCalledOnce();
});

test('Tile2DSourceLayer tracks changed and equivalent activated viewports', () => {
  const layer = createLayer();
  layer.context = {viewport: {id: 'main'}, device: createDevice()} as any;
  layer.initializeState();
  layer.setNeedsUpdate = vi.fn();
  const firstViewport = {id: 'secondary', equals: vi.fn(() => false)};
  layer.activateViewport(firstViewport);
  expect(layer.setNeedsUpdate).toHaveBeenCalledOnce();
  const equivalentViewport = {id: 'secondary', equals: vi.fn(() => true)};
  layer._knownViewports.set('secondary', equivalentViewport);
  layer.activateViewport(equivalentViewport);
  expect(layer.setNeedsUpdate).toHaveBeenCalledOnce();
});

function createDevice(devicePixelRatio = 1) {
  return {
    getCanvasContext: () => ({getDevicePixelRatio: () => devicePixelRatio})
  };
}
function createArrowTile() {
  const schema = {
    fields: [
      {name: 'name', type: 'utf8', nullable: true, metadata: {}},
      {
        name: 'geometry',
        type: 'binary',
        nullable: true,
        metadata: {'ARROW:extension:name': 'geoarrow.wkb'}
      }
    ],
    metadata: {
      geo: JSON.stringify({
        version: '1.1.0',
        primary_column: 'geometry',
        columns: {geometry: {encoding: 'wkb', geometry_types: ['Point']}}
      })
    }
  };
  const builder = new ArrowTableBuilder(schema);
  builder.addObjectRow({
    name: 'arrow tile',
    geometry: new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [1, 2]}))
  });
  return builder.finishTable();
}
