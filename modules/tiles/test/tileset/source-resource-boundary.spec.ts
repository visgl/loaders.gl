// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {I3SLoader} from '@loaders.gl/i3s';
import type {CoreAPI, LoaderContext} from '@loaders.gl/loader-utils';
import {Tileset3D} from '../../src/tileset-3d/common/tileset-3d';
import {Tiles3DSource} from '../../src/tileset-3d/format-3d-tiles/tiles-3d-source';
import {I3SSource} from '../../src/tileset-3d/format-i3s/i3s-source';

/** Creates a tiny preloaded I3S hierarchy with geographic bounds. */
function createI3SMetadata(overrides: Record<string, unknown> = {}) {
  return {
    type: 'I3S',
    url: '/scene/layers/0',
    loader: I3SLoader,
    spatialReference: {wkid: 4326},
    root: {
      id: 'root',
      refine: 'REPLACE',
      mbs: [0, 0, 0, 1],
      boundingVolume: {sphere: [6378137, 0, 0, 1]},
      children: []
    },
    ...overrides
  };
}

/** Creates a parser-normalized 3D Tiles root without requiring a resource load. */
function createTilesMetadata(overrides: Record<string, unknown> = {}) {
  return {
    type: 'TILES3D',
    url: '/tiles/tileset.json',
    loader: Tiles3DLoader,
    asset: {version: '1.1'},
    root: {id: 'root', refine: 'REPLACE', boundingVolume: {sphere: [6378137, 0, 0, 1]}},
    ...overrides
  };
}

describe('I3SSource hierarchy and resource boundaries', () => {
  test('loads declared children in metadata order, reuses existing nodes and retains other children', async () => {
    const loadResource = vi.fn(async (_url, _loader, options) => {
      expect(options.i3s).toMatchObject({isTileHeader: true, retainedOption: 9});
      return {id: '2', mbs: [0, 0, 0, 1], boundingVolume: {sphere: [6378137, 0, 0, 1]}};
    });
    const source = new I3SSource(createI3SMetadata({resolver: {loadResource}}) as any, {
      i3s: {retainedOption: 9}
    });
    const tileset = new Tileset3D(source);
    await tileset.tilesetInitializationPromise;
    const parent = tileset.root!;
    parent.header.children = [{id: 2}, {id: 'existing'}];
    const existing = {id: 'existing', header: {id: 'existing'}} as any;
    const retained = {id: 'other', header: {id: 'other'}} as any;
    parent.children = [retained, existing];

    expect(await source.loadTileChildrenForTraversal(parent)).toEqual({
      loaded: true,
      tileCount: 1,
      childSubtreeCount: 0
    });
    expect(parent.children.map(child => child.id)).toEqual(['2', 'existing', 'other']);
    expect(parent.children[0].parent).toBe(parent);
    expect(parent.children[1]).toBe(existing);
    expect(loadResource).toHaveBeenCalledWith(
      '/scene/layers/0/nodes/2',
      I3SLoader,
      expect.anything()
    );
    expect(await source.loadTileChildrenForTraversal(parent)).toMatchObject({tileCount: 0});
    expect(loadResource).toHaveBeenCalledTimes(1);
    // Restore real runtime children before releasing the tileset.
    parent.children = [parent.children[0]];
    tileset.destroy();
  });

  test('rejects missing IDs and cancellation without installing partial child lists', async () => {
    const cancellation = new Error('cancel traversal');
    const controller = new AbortController();
    const loadResource = vi.fn(async () => {
      controller.abort(cancellation);
      return {id: 'child'};
    });
    const source = new I3SSource(createI3SMetadata({resolver: {loadResource}}) as any);
    await source.initialize();
    const parent = {header: {children: [{id: 'child'}]}, children: []} as any;
    await expect(source.loadTileChildrenForTraversal(parent, controller.signal)).rejects.toBe(
      cancellation
    );
    expect(parent.children).toEqual([]);
    await expect(source.loadTileChildrenForTraversal(parent, controller.signal)).rejects.toBe(
      cancellation
    );
    expect(loadResource).toHaveBeenCalledTimes(1);
    const nullReasonController = new AbortController();
    nullReasonController.abort(null);
    await expect(
      source.loadTileChildrenForTraversal(parent, nullReasonController.signal)
    ).rejects.toMatchObject({name: 'AbortError'});
    parent.header.children = [{}];
    await expect(source.loadTileChildrenForTraversal(parent)).rejects.toThrow(
      'missing its node ID'
    );
    parent.header.children = undefined;
    expect(await source.loadTileChildrenForTraversal(parent)).toMatchObject({tileCount: 0});
  });

  test.each([
    'nodePages',
    'pointNodePages'
  ])('resolves %s children through the injected node-page index', async pageKey => {
    const child = {id: '17', mbs: [0, 0, 0, 1]};
    const formTileFromNodePages = vi.fn(async () => child);
    const source = new I3SSource(
      createI3SMetadata({
        [pageKey]: {},
        nodePagesTile: {formTileFromNodePages, nodesInNodePages: 3}
      }) as any
    );
    await source.initialize();
    expect(await source.loadChildTileHeader({} as any, '17', null)).toBe(child);
    expect(formTileFromNodePages).toHaveBeenCalledWith('17');
    expect(source.getTilesTotalCount()).toBe(3);
  });

  test('supports promised roots and forwards content-specific metadata and loader options', async () => {
    const contentLoader = {...I3SLoader, id: 'binary-content'};
    const loader = {...I3SLoader, contentLoader};
    const payload = {attributes: {POSITION: {value: new Float32Array(3), size: 3}}};
    const load = vi.fn(async () => payload);
    const source = new I3SSource(
      createI3SMetadata({
        loader,
        coreApi: {load},
        root: Promise.resolve({id: 'root', refine: 'ADD'}),
        store: {profile: 'meshpyramids'},
        fields: [{name: 'height'}],
        attributeStorageInfo: [{key: '0'}]
      }) as any,
      {i3s: {token: 'secret', retainedOption: 4}}
    );
    expect(() => source.getMetadata()).toThrow('has not been initialized');
    await source.initialize();
    expect((await source.getRootTileset()).root.id).toBe('root');
    const tile = {
      contentUrl: '/scene/content',
      header: {layerType: '3DObject', textureUrls: ['texture'], metadata: {id: 3}},
      tileset: {
        options: {i3s: {retainedOption: 8}, spatial: {}},
        spatialReference: {status: 'native'}
      },
      boundingVolume: {sphere: []},
      featureIdSets: [{ids: [1]}]
    } as any;
    const result = await source.loadTileContent(tile);
    expect(load).toHaveBeenCalledWith(
      '/scene/content?token=secret',
      contentLoader,
      expect.objectContaining({
        i3s: expect.objectContaining({
          retainedOption: 8,
          isTileHeader: false,
          _tileOptions: expect.objectContaining({layerType: '3DObject', textureUrls: ['texture']}),
          _tilesetOptions: expect.objectContaining({
            store: {profile: 'meshpyramids'},
            fields: [{name: 'height'}]
          })
        })
      })
    );
    expect(result.contentEntries?.[0]).toMatchObject({
      index: 0,
      payload,
      metadata: {id: 3},
      renderable: true
    });
    expect(result.contentEntries?.[0].boundingVolume).toBe(tile.boundingVolume);
    expect(result.contentEntries?.[0].featureIds).toBe(tile.featureIdSets);
    expect(tile.content).toBe(payload);
  });

  test('reports extent centers and monotonically discovers texture and geometry formats', async () => {
    const source = new I3SSource(
      createI3SMetadata({
        fullExtent: {
          xmin: 8,
          xmax: 12,
          ymin: 18,
          ymax: 22,
          zmin: 2,
          zmax: 6
        }
      }) as any
    );
    await source.initialize();
    expect(Array.from(source.getViewState(null).cartographicCenter!)).toEqual([10, 20, 4]);
    const extentSource = new I3SSource(
      createI3SMetadata({store: {extent: [8, 18, 12, 22]}}) as any
    );
    await extentSource.initialize();
    expect(Array.from(extentSource.getViewState(null).cartographicCenter!)).toEqual([10, 20, 0]);
    expect(Number.isFinite(extentSource.getViewState(null).zoom)).toBe(true);
    for (const header of [
      {isDracoGeometry: true, textureFormat: 'dds'},
      {textureFormat: 'ktx2'},
      {}
    ]) {
      source.onTileLoaded({} as any, {header} as any);
    }
    expect(source.contentFormats).toEqual({draco: true, meshopt: false, dds: true, ktx2: true});
    expect(source.getTilesTotalCount()).toBeNull();
    expect(source.getTileUrl('data:application/json,{}')).toBe('data:application/json,{}');
    const tokenSource = new I3SSource(createI3SMetadata() as any, {
      searchParams: {token: 'inherited'}
    });
    expect(tokenSource.getTileUrl('/node?token=own#part')).toBe('/node?token=own#part');
    expect(tokenSource.getTileUrl('/node#part')).toBe('/node?token=inherited#part');
  });

  test('fails URL-backed initialization without transport and attaches nested roots at the parent depth', async () => {
    const unavailable = new I3SSource({url: '/layer', loader: I3SLoader});
    await expect(unavailable.initialize()).rejects.toThrow('injected coreApi');
    const source = new I3SSource(createI3SMetadata() as any);
    const tileset = new Tileset3D(source);
    await tileset.tilesetInitializationPromise;
    const child = source.initializeTileHeaders(
      tileset,
      createI3SMetadata({
        root: {
          id: 'nested',
          mbs: [0, 0, 0, 1],
          boundingVolume: {sphere: [6378137, 0, 0, 1]}
        }
      }) as any,
      tileset.root
    );
    expect(tileset.root!.children).toEqual([child]);
    expect(child.depth).toBe(tileset.root!.depth + 1);
    tileset.destroy();
  });
});

describe('Tiles3DSource embedded resources and lifecycle', () => {
  test.each([
    [{asset: undefined}, 'asset property'],
    [{asset: {version: '9.0'}}, 'version 0.0']
  ])('rejects unsupported root metadata %j', async (overrides, message) => {
    const source = new Tiles3DSource(createTilesMetadata(overrides) as any);
    await expect(source.initialize()).rejects.toThrow(message);
  });

  test('reports metadata without a root volume, recognizes draft versions and inherits child sessions', async () => {
    const source = new Tiles3DSource(
      createTilesMetadata({
        asset: {version: '2.0'},
        formatVersion: '2.0-draft',
        properties: {height: {}},
        extras: {owner: 'test'},
        extensionsUsed: ['TEST_extension'],
        root: {
          id: 'root',
          refine: 'ADD',
          boundingVolume: {sphere: [6378137, 0, 0, 1]},
          children: [
            {
              id: 'child',
              contentUrl: 'https://example.invalid/tile?session=abc',
              boundingVolume: {sphere: [6378137, 0, 0, 1]}
            }
          ]
        }
      }) as any
    );
    expect(() => source.getMetadata()).toThrow('has not been initialized');
    const tileset = new Tileset3D(source);
    await tileset.tilesetInitializationPromise;
    expect(source.getViewState(null)).toMatchObject({
      asset: {version: '2.0'},
      extras: {owner: 'test'},
      credits: {attributions: []}
    });
    expect(source.hasExtension('TEST_extension')).toBe(true);
    expect(source.hasExtension('missing')).toBe(false);
    expect(source.getTileUrl('/other')).toBe('/other?session=abc');
    const emptyCenter = source.getViewState({
      boundingVolume: {center: [0, 0, 0], radius: 1}
    } as any);
    expect(Array.from(emptyCenter.cartographicCenter!)).toEqual([0, 0, -6378137]);
    tileset.destroy();
  });

  test.each([
    {warnings: ['unavailable CRS']},
    {warnings: []}
  ])('rejects unresolved placement with diagnostic warnings $warnings', async ({warnings}) => {
    const source = new Tiles3DSource(createTilesMetadata() as any);
    await source.initialize();
    await expect(
      source.prepareTileset({spatialReference: {status: 'unresolved', warnings}} as any)
    ).rejects.toThrow(warnings[0] || 'cannot be resolved');
  });

  test('slices package ranges and resolves embedded, aliased and external dependencies', async () => {
    const bytes = Uint8Array.of(99, 10, 20, 30, 88).buffer;
    const files = [
      {
        name: 'folder/model.gltf',
        mimeType: 'model/gltf+json',
        data: bytes,
        byteOffset: 1,
        byteLength: 3
      },
      {
        name: 'buffer.bin',
        originalUri: '../buffer.bin',
        mimeType: 'application/octet-stream',
        data: bytes,
        byteOffset: 2,
        byteLength: 2
      },
      {
        name: 'texture.png',
        mimeType: 'image/png',
        uri: '/texture.png',
        byteOffset: 0,
        byteLength: 0
      }
    ];
    const fetchFile = vi.fn(async () => new Response(Uint8Array.of(42)));
    const contexts: LoaderContext[] = [];
    const parse = vi.fn(async (data, _loader, _options, context: LoaderContext) => {
      contexts.push(context);
      expect(Array.from(new Uint8Array(data))).toEqual([10, 20, 30]);
      expect(context.baseUrl).toBe('gltf-package://0/0/folder');
      expect(context.filename).toBe('folder/model.gltf');
      const embedded = await context.fetch!('gltf-package://0/0/buffer.bin');
      expect(embedded.headers.get('content-type')).toBe('application/octet-stream');
      expect(Array.from(new Uint8Array(await embedded.arrayBuffer()))).toEqual([20, 30]);
      expect(
        Array.from(new Uint8Array(await (await context.fetch!('../buffer.bin')).arrayBuffer()))
      ).toEqual([20, 30]);
      const requestOptions = {headers: {accept: 'image/png'}};
      await context.fetch!('texture.png', requestOptions);
      expect(fetchFile).toHaveBeenCalledWith('/texture.png?token=one', requestOptions);
      await expect(context.fetch!('missing.bin')).rejects.toThrow(
        'does not contain file missing.bin'
      );
      return {shape: 'mesh'};
    });
    const source = new Tiles3DSource(
      createTilesMetadata({queryString: 'token=one', coreApi: {parse, fetchFile}}) as any
    );
    await source.initialize();
    const tile = {
      header: {content: {_resource: {fileIndex: 0, files}}},
      contentUrl: '/embedded'
    } as any;
    await source.loadTileContent(tile);
    await source.loadTileContent(tile);
    expect(contexts.map(context => context.url)).toEqual([
      'gltf-package://0/0/folder/model.gltf',
      'gltf-package://0/0/folder/model.gltf'
    ]);
    expect(tile.content).toEqual({shape: 'mesh'});
  });

  test('fetches lazy backing buffers and delegates URI-backed package files', async () => {
    const load = vi.fn(async () => ({shape: 'mesh'}));
    const fetchFile = vi.fn(async () => new Response(Uint8Array.of(8, 9, 10, 11)));
    const parse = vi.fn(async data => {
      expect(Array.from(new Uint8Array(data))).toEqual([9, 10]);
      return {shape: 'mesh'};
    });
    const source = new Tiles3DSource(
      createTilesMetadata({coreApi: {load, parse, fetchFile}, queryString: 'token=one'}) as any
    );
    await source.initialize();
    const tile = {
      contentUrl: '/embedded',
      header: {
        content: {
          _resource: {
            fileIndex: 0,
            files: [
              {mimeType: 'model/gltf-binary', bufferUri: '/buffer', byteOffset: 1, byteLength: 2}
            ]
          }
        }
      }
    } as any;
    await source.loadTileContent(tile);
    expect(fetchFile).toHaveBeenCalledWith('/buffer?token=one');
    expect(parse).toHaveBeenCalledWith(
      expect.any(ArrayBuffer),
      Tiles3DLoader,
      expect.anything(),
      expect.objectContaining({filename: 'content', baseUrl: 'gltf-package://0/0'})
    );
    const externalTile = {
      contentUrl: '/external',
      header: {
        content: {
          _resource: {
            fileIndex: 0,
            files: [{uri: '/actual', byteOffset: 0, byteLength: 0}]
          }
        }
      }
    } as any;
    await source.loadTileContent(externalTile);
    expect(load).toHaveBeenCalledWith('/actual?token=one', Tiles3DLoader, expect.anything());
    fetchFile.mockResolvedValueOnce(new Response(null, {status: 503}));
    await expect(source.loadTileContent(tile)).rejects.toThrow('HTTP 503');
  });

  test('rejects absent package records, unavailable bytes and missing injected APIs', async () => {
    const source = new Tiles3DSource(createTilesMetadata() as any);
    await source.initialize();
    const tile = {
      contentUrl: '/tile',
      header: {content: {_resource: {fileIndex: 0, files: []}}}
    } as any;
    await expect(source.loadTileContent(tile)).rejects.toThrow('missing file 0');
    tile.header.content._resource.files = [{byteOffset: 0, byteLength: 0}];
    await expect(source.loadTileContent(tile)).rejects.toThrow('parse embedded package data');
    source.coreApi = {parse: vi.fn()} as unknown as CoreAPI;
    await expect(source.loadTileContent(tile)).rejects.toThrow('no available byte source');
    const unavailable = new Tiles3DSource({url: '/tileset.json', loader: Tiles3DLoader});
    await expect(unavailable.initialize()).rejects.toThrow('injected coreApi');
  });

  test('cancels hierarchy work before transport and after a contentless traversal', async () => {
    const source = new Tiles3DSource(createTilesMetadata() as any);
    const controller = new AbortController();
    controller.abort('cancelled');
    await expect(
      source.loadTileChildrenForTraversal({header: {}} as any, controller.signal)
    ).rejects.toBe('cancelled');
    const nullReasonController = new AbortController();
    nullReasonController.abort(null);
    await expect(
      source.loadTileChildrenForTraversal({header: {}} as any, nullReasonController.signal)
    ).rejects.toMatchObject({name: 'AbortError'});
    expect(await source.loadTileChildrenForTraversal({header: {}} as any)).toEqual({
      loaded: false,
      tileCount: 0,
      childSubtreeCount: 0
    });
    source.destroy();
    expect(source.getImplicitTilingStats()).toMatchObject({pendingSubtrees: 0, cachedSubtrees: 0});
  });
});
