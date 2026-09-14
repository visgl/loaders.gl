// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {describe, expect, test} from 'vitest';
import {coreApi, load, parse} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';
import {parse3DTileVectorContent} from '../src/lib/parsers/parse-3d-tile-vector-content';
import {parse3DTiles2Tileset} from '../src/lib/parsers/parse-3d-tiles-2-gltf';

describe('experimental explicit 3D Tiles 2.0', () => {
  test('adapts an explicit hierarchy and preserves glTF asset metadata', async () => {
    const tileset = await parse(
      encodeJson(
        createTilesetGltf({
          asset: {version: '2.1', generator: 'draft-fixture'},
          shapes: [
            {type: 'box', box: {size: [4, 6, 8]}},
            {type: 'sphere', sphere: {radius: 2}}
          ],
          nodes: [
            {
              extensions: {
                '3DTILES_tileset': {geometricError: 8, refine: 'REPLACE'}
              },
              boundingVolume: {
                shape: 0,
                matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 2, 3, 1]
              },
              translation: [10, 20, 30],
              children: [1]
            },
            {
              extensions: {'3DTILES_tileset': {geometricError: 0}},
              boundingVolume: {shape: 1, scale: [2, 3, 4]},
              matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 4, 5, 6, 1]
            }
          ]
        })
      ),
      Tiles3DLoader,
      {worker: false}
    );

    expect(tileset.formatVersion).toBe('2.0-draft');
    expect(tileset.asset).toEqual({version: '2.1', generator: 'draft-fixture'});
    expect(tileset.root.boundingVolume.box).toEqual([1, 2, 3, 2, 0, 0, 0, 3, 0, 0, 0, 4]);
    expect(tileset.root.transform).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10, 20, 30, 1]);
    expect(tileset.root.children[0].boundingVolume.sphere).toEqual([0, 0, 0, 8]);
    expect(tileset.root.children[0].transform[12]).toBe(4);
    expect(tileset.root.children[0].refine).toBeUndefined();
  });

  test('loads URI-backed nested tilesets lazily and classifies by structure', async () => {
    const parentUrl = 'https://example.com/tiles/root.resource?token=one';
    const childUrl = 'https://example.com/tiles/nested.resource';
    const requestedUrls: string[] = [];
    const fetch = async (input: RequestInfo | URL): Promise<Response> => {
      const url = input.toString();
      requestedUrls.push(url);
      const json = url.startsWith(childUrl)
        ? createTilesetGltf()
        : createTilesetGltf({
            files: [{uri: 'nested.resource', mimeType: 'model/gltf+json'}],
            externalAssets: [{file: 0}],
            nodes: [
              {
                extensions: {
                  '3DTILES_tileset': {geometricError: 0, refine: 'REPLACE'}
                },
                boundingVolume: {shape: 0},
                externalAsset: 0
              }
            ]
          });
      return new Response(JSON.stringify(json), {status: 200});
    };

    const rootTileset = await load(parentUrl, Tiles3DLoader, {worker: false, fetch});
    expect(requestedUrls).toEqual([parentUrl]);
    const source = new Tiles3DSource({...rootTileset, coreApi}, {worker: false, fetch});
    const tileset = new Tileset3D(source);
    await tileset.tilesetInitializationPromise;
    const result = await tileset.root!.loadContent();

    expect(requestedUrls).toEqual([parentUrl, `${childUrl}?token=one`]);
    expect(result.nestedTileset?.formatVersion).toBe('2.0-draft');
    expect(tileset.root!.hasTilesetContent).toBe(true);
  });

  test('resolves bufferView-backed package names and exposes vector topology on Tile3D', async () => {
    const childJson = {
      asset: {version: '2.0'},
      buffers: [{byteLength: 12, uri: 'positions.bin'}],
      bufferViews: [{buffer: 0, byteOffset: 0, byteLength: 12}],
      accessors: [{bufferView: 0, componentType: 5126, count: 1, type: 'VEC3'}],
      meshes: [{primitives: [{attributes: {POSITION: 0}, mode: 0}]}],
      nodes: [{mesh: 0}],
      scenes: [{nodes: [0]}],
      scene: 0
    };
    const childBytes = new TextEncoder().encode(JSON.stringify(childJson));
    const positionBytes = new Uint8Array(new Float32Array([1, 2, 3]).buffer);
    const positionOffset = alignToFour(childBytes.byteLength);
    const binary = new Uint8Array(positionOffset + positionBytes.byteLength);
    binary.set(childBytes);
    binary.set(positionBytes, positionOffset);
    const parent = createTilesetGltf({
      extensionsUsed: ['3DTILES_tileset', '3DTILES_tileset_vectors'],
      extensionsRequired: ['3DTILES_tileset'],
      extensions: {
        '3DTILES_tileset': {geometricError: 16},
        '3DTILES_tileset_vectors': {clip: true}
      },
      buffers: [{byteLength: binary.byteLength}],
      bufferViews: [
        {buffer: 0, byteOffset: 0, byteLength: childBytes.byteLength},
        {buffer: 0, byteOffset: positionOffset, byteLength: positionBytes.byteLength}
      ],
      files: [
        {bufferView: 0, mimeType: 'model/gltf+json', name: 'content.gltf'},
        {bufferView: 1, mimeType: 'application/octet-stream', name: 'positions.bin'}
      ],
      externalAssets: [{file: 0}],
      nodes: [
        {
          extensions: {'3DTILES_tileset': {geometricError: 0, refine: 'REPLACE'}},
          boundingVolume: {shape: 0},
          externalAsset: 0
        }
      ]
    });
    const rootTileset = await parse(encodeGlb(parent, binary), Tiles3DLoader, {worker: false});
    expect(rootTileset.root.content._resource.files[1].data).toBeInstanceOf(ArrayBuffer);

    const tileset = new Tileset3D(new Tiles3DSource({...rootTileset, coreApi}, {worker: false}));
    await tileset.tilesetInitializationPromise;
    await tileset.root!.loadContent();

    expect(tileset.root!.content.vectorContent).toMatchObject({
      clip: true,
      primitives: [{type: 'points', meshIndex: 0, primitiveIndex: 0, pointCount: 1}]
    });
    expect(tileset.root!.vectorContent).toBe(tileset.root!.content.vectorContent);
    expect(tileset.root!.content.gltf.meshes[0].primitives[0].attributes.POSITION.value).toEqual(
      new Float32Array([1, 2, 3])
    );
  });

  test('normalizes the 1.1 vector preview to the same loaded contract', async () => {
    const vectorGltf = {
      asset: {version: '2.0'},
      accessors: [{componentType: 5126, count: 2, type: 'VEC3'}],
      meshes: [{primitives: [{attributes: {POSITION: 0}, mode: 3}]}]
    };
    const tilesetJson = {
      asset: {version: '1.1'},
      geometricError: 1,
      root: {
        geometricError: 0,
        refine: 'REPLACE',
        boundingVolume: {sphere: [0, 0, 0, 1]},
        content: {
          uri: `data:model/gltf+json,${encodeURIComponent(JSON.stringify(vectorGltf))}`,
          extensions: {
            '3DTILES_content_gltf_vector': {vector: true, clip: false}
          }
        }
      },
      extensionsUsed: ['3DTILES_content_gltf_vector']
    };
    const rootTileset = await parse(encodeJson(tilesetJson), Tiles3DLoader, {worker: false});
    const tileset = new Tileset3D(new Tiles3DSource({...rootTileset, coreApi}, {worker: false}));
    await tileset.tilesetInitializationPromise;
    await tileset.root!.loadContent();

    expect(rootTileset.formatVersion).toBe('1.1');
    expect(tileset.root!.vectorContent).toMatchObject({
      clip: false,
      primitives: [{type: 'polylines', ranges: [{offset: 0, count: 2}]}]
    });
  });

  test('rejects unsupported required extensions and malformed draft structures', async () => {
    await expect(
      parse(
        encodeJson(
          createTilesetGltf({
            extensionsRequired: ['3DTILES_tileset', 'VENDOR_required']
          })
        ),
        Tiles3DLoader,
        {worker: false}
      )
    ).rejects.toThrow(/Unsupported required 3D Tiles extension: VENDOR_required/);
    await expect(
      parse(encodeJson(createTilesetGltf({extensionsRequired: []})), Tiles3DLoader, {worker: false})
    ).rejects.toThrow(/3DTILES_tileset must be declared in extensionsRequired/);
    await expect(
      parse(
        encodeJson(
          createTilesetGltf({
            extensions: {
              '3DTILES_tileset': {geometricError: 16},
              '3DTILES_tileset_vectors': {clip: 'yes'}
            }
          })
        ),
        Tiles3DLoader,
        {worker: false}
      )
    ).rejects.toThrow(/3DTILES_tileset_vectors: clip must be boolean/);
    await expect(
      parse(encodeJson(createTilesetGltf({scenes: [{nodes: [0, 1]}]})), Tiles3DLoader, {
        worker: false
      })
    ).rejects.toThrow(/one scene with one root node/);
    await expect(
      parse(
        encodeJson({
          asset: {version: '2.1'},
          extensions: {'3DTILES_subtree': {}},
          extensionsUsed: ['3DTILES_subtree']
        }),
        Tiles3DLoader,
        {worker: false}
      )
    ).rejects.toThrow(/glTF subtree parsing is not supported/);
  });

  test('validates malformed 1.1 vector preview declarations', async () => {
    await expect(
      parse(
        encodeJson({
          asset: {version: '1.1'},
          geometricError: 1,
          root: {
            geometricError: 0,
            refine: 'REPLACE',
            boundingVolume: {sphere: [0, 0, 0, 1]},
            content: {
              uri: 'content.glb',
              extensions: {'3DTILES_content_gltf_vector': {vector: false}}
            }
          }
        }),
        Tiles3DLoader,
        {worker: false}
      )
    ).rejects.toThrow(/3DTILES_content_gltf_vector: vector must be true/);
  });

  test('retains structured-cloneable draft state across the worker transfer boundary', async () => {
    const result = await parse(
      encodeGlb(createTilesetGltf({buffers: [{byteLength: 4}]}), new Uint8Array(4)),
      Tiles3DLoader,
      {worker: true}
    );
    const serializedResult = Tiles3DLoader.serializeWorkerResult!(result);
    const transferredResult = Tiles3DLoader.deserializeWorkerResult!(
      structuredClone(serializedResult)
    ) as typeof result;
    expect(transferredResult.formatVersion).toBe('2.0-draft');
    expect(transferredResult.loader).toBe(Tiles3DLoader);
    expect(transferredResult.root.boundingVolume.box).toEqual([
      0, 0, 0, 0.5, 0, 0, 0, 0.5, 0, 0, 0, 0.5
    ]);
    const renderContent = {shape: 'mesh'};
    expect(Tiles3DLoader.serializeWorkerResult!(renderContent as never)).toBe(renderContent);
    expect(Tiles3DLoader.deserializeWorkerResult!(renderContent)).toBe(renderContent);
  });

  test('exposes decoded polygon topology without replacing the glTF primitive', () => {
    const topology = {
      indicesOffsets: new Uint16Array([0]),
      loopIndices: new Uint16Array([0, 1, 2, 65535]),
      loopIndicesOffsets: new Uint16Array([0]),
      polygons: [
        {
          triangleRange: {offset: 0, count: 3},
          loopRanges: [{offset: 0, count: 3}]
        }
      ]
    };
    const primitive = {
      mode: 4,
      attributes: {},
      indices: {count: 3},
      extensions: {EXT_mesh_polygon: {count: 1, data: topology}}
    };

    const vectorContent = parse3DTileVectorContent(
      {meshes: [{primitives: [primitive]}]} as never,
      true
    );

    expect(vectorContent.primitives[0]).toMatchObject({type: 'polygons', topology});
    expect(vectorContent.primitives[0].primitive).toBe(primitive);
  });

  test.each([
    [
      'invalid top-level error',
      (json: any) => (json.extensions['3DTILES_tileset'].geometricError = -1),
      /top-level geometricError/
    ],
    [
      'invalid root reference',
      (json: any) => (json.scenes[0].nodes = [99]),
      /invalid root node 99/
    ],
    [
      'missing node extension',
      (json: any) => delete json.nodes[0].extensions,
      /requires a nonnegative geometricError/
    ],
    [
      'missing root refinement',
      (json: any) => delete json.nodes[0].extensions['3DTILES_tileset'].refine,
      /root node requires ADD or REPLACE/
    ],
    [
      'missing node volume',
      (json: any) => delete json.nodes[0].boundingVolume,
      /requires a boundingVolume/
    ],
    ['tile mesh', (json: any) => (json.nodes[0].mesh = 0), /must not define a mesh/],
    ['missing child', (json: any) => (json.nodes[0].children = [1]), /invalid child node 1/],
    ['node cycle', (json: any) => (json.nodes[0].children = [0]), /contains a cycle/],
    [
      'empty-node content metadata',
      (json: any) => (json.nodes[0].extensions['3DTILES_tileset'].content = {}),
      /content metadata on empty node/
    ],
    [
      'missing external asset',
      (json: any) => (json.nodes[0].externalAsset = 0),
      /references missing external asset/
    ],
    [
      'missing package file',
      (json: any) => {
        json.nodes[0].externalAsset = 0;
        json.externalAssets = [{file: 0}];
      },
      /references missing file/
    ],
    [
      'missing file mime type',
      (json: any) => (json.files = [{uri: 'content.glb'}]),
      /requires mimeType/
    ],
    [
      'ambiguous file source',
      (json: any) =>
        (json.files = [{uri: 'content.glb', bufferView: 0, mimeType: 'model/gltf-binary'}]),
      /exactly one data source/
    ],
    [
      'missing file buffer view',
      (json: any) => (json.files = [{bufferView: 0, mimeType: 'model/gltf-binary'}]),
      /references missing bufferView/
    ],
    [
      'missing shape',
      (json: any) => (json.nodes[0].boundingVolume.shape = 2),
      /references missing shape 2/
    ],
    [
      'unsupported shape',
      (json: any) => (json.shapes[0] = {type: 'ellipsoid'}),
      /unsupported node 0 shape type ellipsoid/
    ]
  ])('rejects %s', (_name, mutate, expectedError) => {
    const json = createTilesetGltf();
    mutate(json);
    expect(() =>
      parse3DTiles2Tileset({json, buffers: []} as never, 'https://example.com/')
    ).toThrow(expectedError);
  });
});

function createTilesetGltf(overrides: Record<string, any> = {}): Record<string, any> {
  return {
    asset: {version: '2.1'},
    extensionsUsed: ['3DTILES_tileset'],
    extensionsRequired: ['3DTILES_tileset'],
    extensions: {'3DTILES_tileset': {geometricError: 16}},
    scenes: [{nodes: [0]}],
    scene: 0,
    shapes: [{type: 'box', box: {size: [1, 1, 1]}}],
    nodes: [
      {
        extensions: {'3DTILES_tileset': {geometricError: 0, refine: 'REPLACE'}},
        boundingVolume: {shape: 0}
      }
    ],
    ...overrides
  };
}

function encodeJson(json: Record<string, any>): ArrayBuffer {
  const data = new TextEncoder().encode(JSON.stringify(json));
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

function encodeGlb(json: Record<string, any>, binary: Uint8Array): ArrayBuffer {
  const jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const jsonLength = alignToFour(jsonBytes.byteLength);
  const binaryLength = alignToFour(binary.byteLength);
  const totalLength = 12 + 8 + jsonLength + (binaryLength ? 8 + binaryLength : 0);
  const arrayBuffer = new ArrayBuffer(totalLength);
  const dataView = new DataView(arrayBuffer);
  dataView.setUint32(0, 0x46546c67, true);
  dataView.setUint32(4, 2, true);
  dataView.setUint32(8, totalLength, true);
  dataView.setUint32(12, jsonLength, true);
  dataView.setUint32(16, 0x4e4f534a, true);
  const output = new Uint8Array(arrayBuffer);
  output.fill(0x20, 20, 20 + jsonLength);
  output.set(jsonBytes, 20);
  if (binaryLength) {
    const chunkOffset = 20 + jsonLength;
    dataView.setUint32(chunkOffset, binaryLength, true);
    dataView.setUint32(chunkOffset + 4, 0x004e4942, true);
    output.set(binary, chunkOffset + 8);
  }
  return arrayBuffer;
}

function alignToFour(byteLength: number): number {
  return (byteLength + 3) & ~3;
}
