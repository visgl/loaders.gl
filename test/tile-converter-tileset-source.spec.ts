// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Tiles3DSource, Tileset3D, type TilesetContentTraversalItem} from '@loaders.gl/tiles';
import {createTilesetConversionSource} from '@loaders.gl/tile-converter/v5/core';
import {convertTileset} from '@loaders.gl/tile-converter/v5/core';

/** Creates a source-backed runtime with an empty root and two content-bearing placements. */
function createTileset() {
  const boundingVolume = {sphere: [6_378_137, 0, 0, 10]};
  const tileDefaults = {
    boundingVolume,
    refine: 'ADD',
    lodMetricType: 'geometricError',
    lodMetricValue: 1
  };
  const source = new Tiles3DSource({
    shape: 'tileset3d',
    type: 'TILES3D',
    url: '/fixture/tileset.json',
    basePath: '/fixture',
    loader: Tiles3DLoader,
    asset: {version: '1.1'},
    lodMetricType: 'geometricError',
    lodMetricValue: 1,
    root: {
      ...tileDefaults,
      id: 'root',
      children: [
        {
          ...tileDefaults,
          id: 'first',
          contentUrls: ['first-a.glb', 'first-b.glb'],
          content: [{uri: 'first-a.glb'}, {uri: 'first-b.glb'}]
        },
        {
          ...tileDefaults,
          id: 'second',
          contentUrl: 'second.glb',
          content: {uri: 'second.glb'}
        }
      ]
    }
  });
  const loadContent = vi.spyOn(source, 'loadTileContent').mockImplementation(async tile => ({
    loaded: true,
    contents: tile.contentUrls.map(uri => ({
      uri,
      type: 'b3dm',
      vertexCount: 3,
      byteLength: 1,
      destroy: vi.fn()
    }))
  }));
  return {tileset: new Tileset3D(source), source, loadContent};
}

test.each([
  false,
  true
])('source-backed conversion awaits writes with cleanup %s', async unloadContent => {
  const {tileset, source, loadContent} = createTileset();
  const adapter = createTilesetConversionSource(tileset, {unloadContent});
  const observed: TilesetContentTraversalItem[] = [];
  let notifyWrite!: () => void;
  let releaseWrite!: () => void;
  const writeStarted = new Promise<void>(resolve => {
    notifyWrite = resolve;
  });
  const writeGate = new Promise<void>(resolve => {
    releaseWrite = resolve;
  });
  const write = vi.fn(async () => {
    notifyWrite();
    await writeGate;
  });
  const finalize = vi.fn(async () => {});
  const abort = vi.fn(async () => {});
  const conversion = convertTileset({
    source: adapter,
    codec: {
      async *convert(item, inspection) {
        expect(inspection).toBe(source.getMetadata());
        observed.push(item);
        for (const content of item.contents) {
          yield content;
        }
      }
    },
    sink: {write, finalize, abort},
    measureInputBytes: item => item.contents.length,
    measureOutputBytes: () => 1
  });
  try {
    try {
      await Promise.race([writeStarted, conversion]);
      expect(loadContent).toHaveBeenCalledTimes(1);
      expect(observed.map(item => item.tile.id)).toEqual(['root', 'first']);
      expect(finalize).not.toHaveBeenCalled();
      expect(
        (observed[1].contents[0].payload as {destroy: () => void}).destroy
      ).not.toHaveBeenCalled();
    } finally {
      releaseWrite();
    }
    const report = await conversion;
    expect(observed.map(item => item.tile.id)).toEqual(['root', 'first', 'second']);
    expect(observed[0].contents).toEqual([]);
    expect(observed[1].contents.map(content => content.index)).toEqual([0, 1]);
    expect(observed[1].contents.map(content => content.uri)).toEqual([
      'first-a.glb',
      'first-b.glb'
    ]);
    expect(observed[1].tile).toBe(tileset.root!.children[0]);
    if (unloadContent) {
      expect(observed[1].tile.content).toBeNull();
      expect(observed[1].tile.contentEntries.every(content => content.payload === null)).toBe(true);
    } else {
      expect(observed[1].contents).toBe(observed[1].tile.contentEntries);
    }
    expect(observed[1].contents.every(content => content.payload)).toBe(true);
    for (const item of observed) {
      for (const content of item.contents) {
        expect((content.payload as {destroy: () => void}).destroy).toHaveBeenCalledTimes(
          unloadContent ? 1 : 0
        );
      }
    }
    expect(report).toMatchObject({
      state: 'completed',
      inputResources: 3,
      outputResources: 3,
      inputBytes: 3,
      outputBytes: 3
    });
    expect(finalize).toHaveBeenCalledExactlyOnceWith(report);
    expect(abort).not.toHaveBeenCalled();
  } finally {
    tileset.destroy();
  }
});

test('source-backed conversion releases oversized input before aborting the destination', async () => {
  const {tileset, loadContent} = createTileset();
  const abort = vi.fn(async () => {
    expect(tileset.root!.children[0].content).toBeNull();
  });
  const write = vi.fn(async () => {});
  const finalize = vi.fn(async () => {});
  try {
    await expect(
      convertTileset({
        source: createTilesetConversionSource(tileset, {unloadContent: true}),
        codec: {
          async *convert(item) {
            for (const content of item.contents) yield content;
          }
        },
        sink: {write, finalize, abort},
        measureInputBytes: item => item.contents.length,
        measureOutputBytes: () => 1,
        maxInputResourceBytes: 1
      })
    ).rejects.toMatchObject({code: 'INPUT_RESOURCE_TOO_LARGE'});
    expect(loadContent).toHaveBeenCalledOnce();
    const loaded = (await loadContent.mock.results[0].value).contents!;
    expect(loaded.every(content => content.destroy.mock.calls.length === 1)).toBe(true);
    expect(write).not.toHaveBeenCalled();
    expect(finalize).not.toHaveBeenCalled();
    expect(abort).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({code: 'INPUT_RESOURCE_TOO_LARGE'})
    );
  } finally {
    tileset.destroy();
  }
});

test('source reading forwards cancellation to shared traversal', async () => {
  const {tileset, loadContent} = createTileset();
  const adapter = createTilesetConversionSource(tileset);
  const controller = new AbortController();
  const reason = new Error('cancelled');
  try {
    const inspection = await adapter.inspect();
    const reader = adapter.read(inspection, controller.signal)[Symbol.asyncIterator]();
    controller.abort(reason);
    await expect(reader.next()).rejects.toBe(reason);
    expect(loadContent).not.toHaveBeenCalled();
  } finally {
    tileset.destroy();
  }
});

test('source inspection awaits initialization and rejects a missing root', async () => {
  const {tileset} = createTileset();
  try {
    await tileset.tilesetInitializationPromise;
    tileset.root = null;
    await expect(createTilesetConversionSource(tileset).inspect()).rejects.toMatchObject({
      code: 'TILESET_ROOT_REQUIRED'
    });
  } finally {
    tileset.destroy();
  }
});

test.each([
  'before',
  'during'
] as const)('source inspection observes cancellation %s initialization', async phase => {
  const {tileset, source} = createTileset();
  await tileset.tilesetInitializationPromise;
  const getMetadata = vi.spyOn(source, 'getMetadata');
  const controller = new AbortController();
  const reason = new Error('cancelled');
  if (phase === 'before') {
    controller.abort(reason);
  } else {
    tileset.tilesetInitializationPromise = Promise.resolve().then(() => {
      controller.abort(reason);
    });
  }
  try {
    await expect(createTilesetConversionSource(tileset).inspect(controller.signal)).rejects.toBe(
      reason
    );
    expect(getMetadata).not.toHaveBeenCalled();
  } finally {
    tileset.destroy();
  }
});

test('source-backed conversion aborts after cancellation without loading the next placement', async () => {
  const {tileset, loadContent} = createTileset();
  const controller = new AbortController();
  const reason = new Error('cancelled');
  const abort = vi.fn(async () => {});
  const finalize = vi.fn(async () => {});
  try {
    await expect(
      convertTileset({
        source: createTilesetConversionSource(tileset),
        codec: {
          async *convert(item) {
            yield item;
          }
        },
        sink: {
          write: async () => {
            controller.abort(reason);
          },
          finalize,
          abort
        },
        measureInputBytes: () => 0,
        measureOutputBytes: () => 0,
        signal: controller.signal
      })
    ).rejects.toBe(reason);
    expect(loadContent).not.toHaveBeenCalled();
    expect(abort).toHaveBeenCalledExactlyOnceWith(reason);
    expect(finalize).not.toHaveBeenCalled();
  } finally {
    tileset.destroy();
  }
});
