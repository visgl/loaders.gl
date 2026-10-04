// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, afterAll, afterEach, expect, test, vi} from 'vitest';
import React, {act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {Tiles3DArchiveSource, Tiles3DArchiveWriter} from '@loaders.gl/3d-tiles';
import {SLPKSource} from '@loaders.gl/i3s';
import {fetchFile, load, parse} from '@loaders.gl/core';
import {Tileset3D} from '@loaders.gl/tiles';
import {GLTFScenegraph, GLTFWriter} from '@loaders.gl/gltf';
import {createArchiveSource} from '../examples/website/i3s-slpk/src/archive-source';

const layerMock = vi.hoisted(() => ({selections: [] as any[], viewState: null as any}));
vi.mock('@loaders.gl/deck-layers', () => ({
  SourceLayer: class {
    /** Captures example handoff while format-owner tests cover renderer internals. */
    constructor(properties: any) {
      layerMock.selections.push(properties);
    }
  }
}));
vi.mock('@deck.gl/react', () => ({
  default: (props: any) => {
    layerMock.viewState = props.initialViewState;
    return null;
  }
}));
vi.mock('react-map-gl/maplibre', () => ({default: () => null}));
import App from '../examples/website/i3s-slpk/src/app';

beforeAll(() => vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true));
afterAll(() => vi.unstubAllGlobals());

let root: Root | undefined;
let container: HTMLDivElement | undefined;
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
  layerMock.selections.length = 0;
});

/** Mounts the example controls without network basemap or GPU renderer dependencies. */
async function mountExample(): Promise<HTMLDivElement> {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root!.render(React.createElement(App)));
  return container;
}

/** Selects a real browser File through the example's drop handler. */
async function dropArchive(element: HTMLElement, name: string): Promise<void> {
  const transfer = new DataTransfer();
  transfer.items.add(new File(['fixture'], name));
  await act(async () =>
    element.firstElementChild!.dispatchEvent(
      new DragEvent('drop', {bubbles: true, cancelable: true, dataTransfer: transfer})
    )
  );
}

test.each([
  'slpk',
  '3tz'
] as const)('archive example selects local and signed remote %s sources', format => {
  const expected = format === 'slpk' ? SLPKSource : Tiles3DArchiveSource;
  const localSource = createArchiveSource(new File([], `scene.${format.toUpperCase()}`));
  expect(localSource).toBeInstanceOf(expected);
  expect(localSource.loadOptions.worker).toBe(false);
  expect(
    createArchiveSource(`https://example.invalid/scene.${format}?signature=secret#fragment`)
  ).toBeInstanceOf(expected);
  expect(createArchiveSource('https://example.invalid/download?id=1', format)).toBeInstanceOf(
    expected
  );
});

test('archive example rejects unsupported selections before replacing the current scene', async () => {
  expect(() => createArchiveSource(new File([], 'scene.zip'))).toThrow(/\.slpk/);
  expect(() => createArchiveSource('https://example.invalid/download')).toThrow(/format/);
  expect(() => createArchiveSource('file:///scene.slpk')).toThrow(/HTTP/);
  expect(() => createArchiveSource('not a URL')).toThrow();
  const element = await mountExample();
  await dropArchive(element, 'first.slpk');
  const first = layerMock.selections.at(-1);
  await dropArchive(element, 'bad.zip');
  expect(element.querySelector('[role="alert"]')?.textContent).toContain('.slpk');
  expect(layerMock.selections.at(-1).data).toBe(first.data);
});

test('archive example drops both formats and gives a replacement scene its own layer identity', async () => {
  const element = await mountExample();
  expect(element.querySelector('input[type="file"]')?.getAttribute('accept')).toBe('.slpk,.3tz');
  await dropArchive(element, 'first.slpk');
  const first = layerMock.selections.at(-1);
  expect(first.data).toBeInstanceOf(SLPKSource);
  const meshExtension = first._subLayerProps['tile-3d']._subLayerProps.mesh.extensions[0];
  expect(meshExtension.getShaders().inject['fs:#main-start']).toContain('vec4(1.0)');
  await dropArchive(element, 'second.3tz');
  const second = layerMock.selections.at(-1);
  expect(second.data).toBeInstanceOf(Tiles3DArchiveSource);
  expect(second.id).not.toBe(first.id);
  await act(async () => first.onTileError(null, 'Stale tile error', 'old'));
  expect(element.querySelector('[role="alert"]')).toBeNull();
  await act(async () => second.onTileError(null, 'Current tile error', 'new'));
  expect(element.querySelector('[role="alert"]')?.textContent).toBe('Current tile error');
  await act(async () => first.onError(new Error('Stale initialization error')));
  expect(element.querySelector('[role="alert"]')?.textContent).toBe('Current tile error');
  await act(async () => second.onError(new Error('Invalid archive')));
  expect(element.querySelector('[role="alert"]')?.textContent).toBe('Invalid archive');
  expect(element.textContent).toContain('second.3tz');
  expect(element.textContent).toContain('Tiles load as you pan and zoom');
});

test('archive example supports file picking and explicit format for extensionless URLs', async () => {
  const element = await mountExample();
  const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
  const transfer = new DataTransfer();
  transfer.items.add(new File(['fixture'], 'picked.3tz'));
  fileInput.files = transfer.files;
  await act(async () => fileInput.dispatchEvent(new Event('change', {bubbles: true})));
  expect(layerMock.selections.at(-1).data).toBeInstanceOf(Tiles3DArchiveSource);
  const input = element.querySelector('input[type="url"]') as HTMLInputElement;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(
    input,
    'https://example.invalid/download'
  );
  await act(async () => input.dispatchEvent(new Event('input', {bubbles: true})));
  const format = element.querySelector('select')!;
  format.value = 'slpk';
  await act(async () => format.dispatchEvent(new Event('change', {bubbles: true})));
  await act(async () =>
    element
      .querySelector('form')!
      .dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}))
  );
  expect(layerMock.selections.at(-1).data).toBeInstanceOf(SLPKSource);
});

/** Authors a deterministic tiny GLB for the example's real source integration boundary. */
function createTriangle(): ArrayBuffer {
  const scene = new GLTFScenegraph({json: {asset: {version: '2.0'}}});
  const mesh = scene.addMesh({
    attributes: {POSITION: {value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), size: 3}},
    indices: new Uint16Array([0, 1, 2])
  });
  scene.setDefaultScene(scene.addScene({nodeIndices: [scene.addNode({meshIndex: mesh})]}));
  scene.createBinaryChunk();
  return GLTFWriter.encodeSync!(scene.gltf);
}

test('example 3TZ source initializes metadata and decodes a tile only when requested', async () => {
  const tileset = {
    asset: {version: '1.1'},
    geometricError: 1,
    root: {
      boundingVolume: {region: [0, 0, 0.001, 0.001, 0, 100]},
      geometricError: 0,
      content: {uri: 'triangle.glb'}
    }
  };
  const bytes = await Tiles3DArchiveWriter.encode!(
    {
      'tileset.json': new TextEncoder().encode(JSON.stringify(tileset)).buffer,
      'triangle.glb': createTriangle()
    },
    {'3tz': {maxArchiveBytes: 8192}}
  );
  const source = createArchiveSource(new File([bytes], 'tiny.3tz'));
  source.coreApi = {fetchFile, load, parse} as any;
  const readContent = vi.spyOn(source, 'loadTileContent');
  const runtime = new Tileset3D(source, {
    loadOptions: {'3d-tiles': {loadGLTF: true}, gltf: {loadImages: false}, worker: false}
  });
  await runtime.tilesetInitializationPromise;
  try {
    expect(readContent).not.toHaveBeenCalled();
    expect(runtime.root!.content).toBeNull();
    const result = await runtime.root!.loadContentForTraversal();
    expect(result.loaded).toBe(true);
    expect(readContent).toHaveBeenCalledOnce();
    expect(
      (runtime.root!.content as any).gltf.meshes[0].primitives[0].attributes.POSITION.value
    ).toHaveLength(9);
  } finally {
    runtime.destroy();
  }
});

test('archive example fits elevated scenes and ignores stale camera callbacks', async () => {
  const element = await mountExample();
  await dropArchive(element, 'first.slpk');
  const first = layerMock.selections.at(-1);
  await dropArchive(element, 'second.3tz');
  const second = layerMock.selections.at(-1);
  const tileset = {
    cartographicCenter: [0, 0, 0],
    root: {boundingVolume: {center: [6378237, 0, 0]}},
    zoom: 18
  };
  await act(async () => second.onTilesetLoad(tileset));
  expect(layerMock.viewState).toMatchObject({
    longitude: 0,
    latitude: 0,
    zoom: 18,
    position: [0, 0, 100]
  });
  await act(async () => first.onTilesetLoad({...tileset, zoom: 20}));
  expect(layerMock.viewState.zoom).toBe(18);
});
