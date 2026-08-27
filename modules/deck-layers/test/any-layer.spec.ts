// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {AnyLayer, SourceLayer, type SourceLayerProps} from '@loaders.gl/deck-layers';
import type {Loader, SourceLoader} from '@loaders.gl/loader-utils';
import {
  classifyVisualSource,
  createSourceViewState,
  getFirstSourceLayerName,
  getSourceCoordinateReferenceSystem,
  resolveVisualSource
} from '../src/source-layer-utils';

const TEST_PARSER_LOADER = {
  id: 'test-parser',
  name: 'Test parser',
  module: 'test',
  version: '1.0.0',
  extensions: ['bin'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  parse: async () => ({})
} as Loader;

function createTileSource(overrides: Record<string, unknown> = {}) {
  return {
    mimeType: 'image/png',
    options: {},
    async getMetadata() {
      return {
        minZoom: 1,
        maxZoom: 8,
        boundingBox: [
          [-10, -5],
          [20, 15]
        ]
      };
    },
    async getTileData() {
      return null;
    },
    ...overrides
  };
}

function createSourceLoader(
  type: string,
  createDataSource: SourceLoader['createDataSource'],
  overrides: Partial<SourceLoader> = {}
): SourceLoader {
  return {
    id: `${type}-source`,
    name: `${type} source`,
    module: 'test',
    version: '1.0.0',
    extensions: [type],
    mimeTypes: [`application/x-${type}`],
    type,
    fromUrl: true,
    fromBlob: true,
    defaultOptions: {},
    testURL: () => true,
    testData: () => true,
    createDataSource,
    ...overrides
  } as SourceLoader;
}

function createTestLayer(props: SourceLayerProps): SourceLayer & Record<string, any> {
  const layer = new SourceLayer(props as any) as SourceLayer & Record<string, any>;
  layer.initializeState();
  layer.setState = ((state: Record<string, unknown>) => Object.assign(layer.state, state)) as any;
  layer.raiseError = vi.fn();
  return layer;
}

describe('resolveVisualSource', () => {
  test('partitions mixed loaders and gives source loaders precedence over parser fallback', async () => {
    let capturedOptions: any;
    const source = createTileSource();
    const sourceLoader = createSourceLoader('tile', (_data, options) => {
      capturedOptions = options;
      return source as any;
    });

    const result = await resolveVisualSource({
      data: 'https://example.com/tiles.tile',
      loaders: [sourceLoader, TEST_PARSER_LOADER]
    });

    expect(result.source).toBe(source);
    expect(result.sourceType).toBe('tile-2d');
    expect(result.sourceLoader).toBe(sourceLoader);
    expect(result.parserLoaders).toEqual([TEST_PARSER_LOADER]);
    expect(capturedOptions.core.loaders).toEqual([TEST_PARSER_LOADER]);
  });

  test('combines compatibility sources with loaders and deduplicates by identity', async () => {
    const createDataSource = vi.fn(() => createTileSource() as any);
    const sourceLoader = createSourceLoader('tile', createDataSource);

    const result = await resolveVisualSource({
      data: 'https://example.com/tiles.tile',
      sources: [sourceLoader],
      loaders: [sourceLoader]
    });

    expect(result.sourceLoader).toBe(sourceLoader);
    expect(createDataSource).toHaveBeenCalledOnce();
  });

  test('uses async preload for lightweight source loaders', async () => {
    const source = createTileSource();
    const runtimeLoader = createSourceLoader('tile', () => source as any);
    const preload = vi.fn(async () => runtimeLoader);
    const lightweightLoader = createSourceLoader(
      'tile',
      () => {
        throw new Error('lightweight createDataSource must not be called');
      },
      {preload}
    );

    const result = await resolveVisualSource({
      data: 'https://example.com/tiles.tile',
      loaders: [lightweightLoader]
    });

    expect(preload).toHaveBeenCalledOnce();
    expect(result.source).toBe(source);
    expect(result.sourceLoader).toBe(lightweightLoader);
  });

  test('supports Blob inputs', async () => {
    const source = createTileSource();
    const sourceLoader = createSourceLoader('tile', () => source as any);

    const result = await resolveVisualSource({
      data: new Blob([new Uint8Array([1, 2, 3])], {type: 'application/x-tile'}),
      loaders: [sourceLoader]
    });

    expect(result.source).toBe(source);
    expect(result.sourceType).toBe('tile-2d');
  });

  test('honors explicit source types and reports available alternatives', async () => {
    const tileLoader = createSourceLoader('tile', () => createTileSource() as any);

    await expect(
      resolveVisualSource({
        data: 'https://example.com/source',
        loaders: [tileLoader, TEST_PARSER_LOADER],
        sourceOptions: {core: {type: 'wms'}}
      })
    ).rejects.toThrow('Available source types: tile');
  });

  test('uses parser-backed 3D fallback when no source loader matches', async () => {
    const result = await resolveVisualSource({
      data: 'https://example.com/tileset.json',
      loaders: [TEST_PARSER_LOADER]
    });

    expect(result.sourceType).toBe('tile-3d');
    expect(result.source).toBe('https://example.com/tileset.json');
  });

  test('reports capabilities for unsupported runtimes', async () => {
    const catalogLoader = createSourceLoader(
      'catalog',
      () => ({getMetadata() {}, search() {}, getCollections() {}}) as any
    );

    await expect(
      resolveVisualSource({data: 'https://example.com/catalog', loaders: [catalogLoader]})
    ).rejects.toThrow(/getCollections.*search.*Supported visual sources/);
  });
});

describe('source classification and metadata defaults', () => {
  test('classifies overlapping runtimes in safe order', () => {
    expect(
      classifyVisualSource({
        initialize() {},
        getRootTile() {},
        getChildren() {},
        loadTileContent() {},
        getMetadata() {},
        getTileData() {}
      })
    ).toBe('point-cloud');
    expect(classifyVisualSource(createTileSource())).toBe('tile-2d');
  });

  test('selects the first named leaf depth-first and its compatible CRS', () => {
    const metadata = {
      layers: [
        {
          name: 'group',
          crs: ['EPSG:27700'],
          layers: [
            {name: 'roads', crs: ['EPSG:27700', 'EPSG:3857']},
            {name: 'buildings', crs: ['EPSG:4326']}
          ]
        }
      ]
    };

    expect(getFirstSourceLayerName(metadata)).toBe('roads');
    expect(getSourceCoordinateReferenceSystem(metadata)).toBe('EPSG:3857');
  });

  test('normalizes metadata bounds into non-binding view hints', async () => {
    const viewState = await createSourceViewState(
      {},
      {
        crs: 'EPSG:4326',
        boundingBox: [
          [-20, -10],
          [40, 30]
        ]
      }
    );

    expect(viewState).toMatchObject({
      bounds: [
        [-20, -10],
        [40, 30]
      ],
      longitude: 10,
      latitude: 10,
      target: [10, 10, 0],
      crs: 'EPSG:4326'
    });
  });
});

describe('SourceLayer lifecycle and dispatch', () => {
  test('dispatches all normalized runtime families', () => {
    const runtimeCases = [
      [{getMetadata() {}, getImage() {}}, 'image', 'ImageSourceLayer'],
      [{getMetadata() {}, getSchema() {}, getFeatures() {}}, 'vector', 'VectorSourceLayer'],
      [{getMetadata() {}, getRaster() {}}, 'raster', 'RasterSourceLayer'],
      [createTileSource(), 'tile-2d', 'Tile2DSourceLayer'],
      [
        {initialize() {}, getRootTile() {}, getChildren() {}, loadTileContent() {}},
        'point-cloud',
        'PointCloudSourceLayer'
      ]
    ] as const;

    for (const [source, sourceType, expectedLayerName] of runtimeCases) {
      const layer = createTestLayer({id: sourceType, data: source as any});
      layer.state = {
        resolvedSource: {source, sourceType, parserLoaders: [], owned: false},
        metadata: null,
        resolvedLayers: [],
        resolvedCoordinateReferenceSystem: undefined,
        isResolving: false
      };
      const childLayer = (layer.renderLayers() as any[])[0];
      expect(childLayer.constructor.layerName).toBe(expectedLayerName);
      expect(childLayer.props.data).toBe(source);
    }
  });

  test('emits source, metadata, and view callbacks once and preserves explicit empty layers', async () => {
    const source = createTileSource();
    const onSourceLoad = vi.fn();
    const onMetadataLoad = vi.fn();
    const onViewStateLoad = vi.fn();
    const layer = createTestLayer({
      id: 'callbacks',
      data: source as any,
      layers: [],
      onSourceLoad,
      onMetadataLoad,
      onViewStateLoad
    });

    await layer.resolveSource(layer.props);

    expect(onSourceLoad).toHaveBeenCalledOnce();
    expect(onMetadataLoad).toHaveBeenCalledOnce();
    expect(onViewStateLoad).toHaveBeenCalledOnce();
    expect(layer.state.resolvedLayers).toEqual([]);
  });

  test('suppresses stale async resolutions and finalizes their owned runtime', async () => {
    let resolvePreload!: (loader: SourceLoader) => void;
    const preloadPromise = new Promise<SourceLoader>(resolve => {
      resolvePreload = resolve;
    });
    const staleSource = createTileSource({finalize: vi.fn()});
    const currentSource = createTileSource();
    const staleRuntimeLoader = createSourceLoader('stale', () => staleSource as any);
    const staleLoader = createSourceLoader('stale', () => staleSource as any, {
      preload: () => preloadPromise
    });
    const currentLoader = createSourceLoader('current', () => currentSource as any);
    const onSourceLoad = vi.fn();
    const layer = createTestLayer({
      id: 'stale',
      data: 'https://example.com/stale',
      loaders: [staleLoader],
      onSourceLoad
    });

    const staleResolution = layer.resolveSource(layer.props);
    const currentProps = {
      ...layer.props,
      data: 'https://example.com/current',
      loaders: [currentLoader]
    };
    layer.props = currentProps;
    const currentResolution = layer.resolveSource(currentProps);
    await currentResolution;
    resolvePreload(staleRuntimeLoader);
    await staleResolution;

    expect(layer.state.resolvedSource.source).toBe(currentSource);
    expect(staleSource.finalize).toHaveBeenCalledOnce();
    expect(onSourceLoad).toHaveBeenCalledOnce();
  });

  test('finalizes replaced owned sources', async () => {
    const firstSource = createTileSource({finalize: vi.fn()});
    const secondSource = createTileSource({finalize: vi.fn()});
    const firstLoader = createSourceLoader('first', () => firstSource as any);
    const secondLoader = createSourceLoader('second', () => secondSource as any);
    const layer = createTestLayer({
      id: 'ownership',
      data: 'https://example.com/first',
      loaders: [firstLoader]
    });

    await layer.resolveSource(layer.props);
    const secondProps = {
      ...layer.props,
      data: 'https://example.com/second',
      loaders: [secondLoader]
    };
    layer.props = secondProps;
    await layer.resolveSource(secondProps);

    expect(firstSource.finalize).toHaveBeenCalledOnce();
    expect(secondSource.finalize).not.toHaveBeenCalled();
  });

  test('AnyLayer is a compatibility alias with its historical debug name', () => {
    const layer = new AnyLayer({id: 'compatibility', data: createTileSource() as any});
    expect(layer).toBeInstanceOf(SourceLayer);
    expect(AnyLayer.layerName).toBe('AnyLayer');
  });
});
