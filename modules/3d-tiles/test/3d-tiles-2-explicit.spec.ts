// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {describe, expect, test} from 'vitest';
import {coreApi, load, parse} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Tile3D, Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';
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
        ? createTilesetGltf({
            extensionsUsed: ['3DTILES_tileset', 'EXT_geospatial_crs', 'EXT_geospatial_crs_wkid'],
            extensionsRequired: [
              '3DTILES_tileset',
              'EXT_geospatial_crs',
              'EXT_geospatial_crs_wkid'
            ],
            extensions: {
              '3DTILES_tileset': {geometricError: 16},
              EXT_geospatial_crs: {
                format: 'wkid',
                extensions: {
                  EXT_geospatial_crs_wkid: {authority: 'EPSG', wkid: 32611}
                }
              }
            }
          })
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
    expect(result.nestedTileset?.spatialMetadata).toMatchObject({
      sourceCrs: 'EPSG:32611',
      coordinateFrame: 'projected'
    });
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

    tileset.root!.unloadContent();
    await tileset.root!.loadContent();
    expect(tileset.root!.vectorContent).toMatchObject({
      clip: true,
      primitives: [{type: 'points', pointCount: 1}]
    });
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
  });

  test('parses glTF subtree availability, attributes and property-table rows', async () => {
    const binary = new Uint8Array(28);
    new Float64Array(binary.buffer, 0, 1)[0] = 12;
    new Uint16Array(binary.buffer, 8, 1)[0] = 7;
    new Uint16Array(binary.buffer, 10, 1)[0] = 9;
    new Uint16Array(binary.buffer, 12, 4).set([1, 2, 3, 4]);
    new Uint16Array(binary.buffer, 20, 2).set([5, 6]);
    const subtree = await parse(
      encodeGlb(
        {
          asset: {version: '2.1'},
          extensionsUsed: ['3DTILES_subtree', 'EXT_structural_metadata'],
          extensionsRequired: ['3DTILES_subtree', 'EXT_structural_metadata'],
          extensions: {
            '3DTILES_subtree': {
              tileAvailability: {constant: 1},
              contentAvailability: {constant: 1},
              childSubtreeAvailability: {constant: 0},
              tileAttributes: {TILE_GEOMETRIC_ERROR: 0},
              tileProperties: 0,
              contentProperties: 1
            },
            EXT_structural_metadata: {
              schema: {
                id: 'implicit',
                classes: {
                  tile: {
                    properties: {
                      zone: {type: 'SCALAR', componentType: 'UINT16', required: true},
                      bounds: {
                        type: 'VEC2',
                        componentType: 'UINT16',
                        array: true,
                        count: 2,
                        required: true
                      },
                      emptyBounds: {
                        type: 'VEC2',
                        componentType: 'UINT16',
                        noData: [5, 6],
                        default: [9, 10]
                      }
                    }
                  },
                  content: {
                    properties: {
                      zone: {type: 'SCALAR', componentType: 'UINT16', required: true}
                    }
                  }
                }
              },
              propertyTables: [
                {
                  class: 'tile',
                  count: 1,
                  properties: {
                    zone: {values: 1},
                    bounds: {values: 3},
                    emptyBounds: {values: 4}
                  }
                },
                {class: 'content', count: 1, properties: {zone: {values: 2}}}
              ]
            }
          },
          buffers: [{byteLength: binary.byteLength}],
          files: [{uri: 'unused-content.gltf', mimeType: 'model/gltf+json'}],
          bufferViews: [
            {buffer: 0, byteOffset: 0, byteLength: 8},
            {buffer: 0, byteOffset: 8, byteLength: 2},
            {buffer: 0, byteOffset: 10, byteLength: 2},
            {buffer: 0, byteOffset: 12, byteLength: 8},
            {buffer: 0, byteOffset: 20, byteLength: 4}
          ],
          accessors: [{bufferView: 0, componentType: 5130, count: 1, type: 'SCALAR'}]
        },
        binary
      ),
      Tiles3DLoader,
      {
        worker: false,
        fetch: async () => {
          throw new Error('subtree package files must stay lazy');
        },
        '3d-tiles': {isSubtree: true, loadGLTF: false}
      }
    );

    expect(subtree.tileAvailability).toEqual({constant: 1});
    expect(subtree.tileAttributes.TILE_GEOMETRIC_ERROR).toEqual(new Float64Array([12]));
    expect(subtree.tilePropertyRows).toEqual([
      {zone: 7, bounds: [1, 2, 3, 4], emptyBounds: [9, 10]}
    ]);
    expect(subtree.contentPropertyRows).toEqual([{zone: 9}]);
    const transferredSubtree = structuredClone(Tiles3DLoader.serializeWorkerResult!(subtree));
    expect(transferredSubtree.tileAttributes.TILE_GEOMETRIC_ERROR).toEqual(new Float64Array([12]));
  });

  test('loads only hierarchy buffers while retaining external package buffers lazily', async () => {
    const subtreeUrl = 'https://example.com/subtrees/root.gltf';
    const hierarchyBufferUrl = 'https://example.com/subtrees/hierarchy.bin';
    const requestedUrls: string[] = [];
    const subtreeJson = {
      asset: {version: '2.1'},
      extensionsUsed: ['3DTILES_subtree'],
      extensionsRequired: ['3DTILES_subtree'],
      extensions: {
        '3DTILES_subtree': {
          tileAvailability: {bitstream: 0},
          contentAvailability: {constant: 0},
          childSubtreeAvailability: {constant: 0}
        }
      },
      buffers: [
        {uri: 'hierarchy.bin', byteLength: 1},
        {uri: 'deferred-content.bin', byteLength: 4}
      ],
      bufferViews: [
        {buffer: 0, byteLength: 1},
        {buffer: 1, byteLength: 4}
      ],
      files: [{bufferView: 1, mimeType: 'application/octet-stream', name: 'content.bin'}]
    };
    const fetch = async (input: RequestInfo | URL): Promise<Response> => {
      const url = input.toString();
      requestedUrls.push(url);
      if (url === subtreeUrl) {
        return new Response(JSON.stringify(subtreeJson), {
          headers: {'content-type': 'model/gltf+json'}
        });
      }
      if (url === hierarchyBufferUrl) {
        return new Response(new Uint8Array([1]));
      }
      throw new Error(`unexpected eager request: ${url}`);
    };

    const subtree = await load(subtreeUrl, Tiles3DLoader, {
      worker: false,
      fetch,
      '3d-tiles': {isSubtree: true, loadGLTF: false}
    });

    expect(requestedUrls).toEqual([subtreeUrl, hierarchyBufferUrl]);
    expect(subtree.tileAvailability.explicitBitstream).toEqual(new Uint8Array([1]));
    expect(subtree.resourceFiles[0]).toMatchObject({
      name: 'content.bin',
      bufferUri: 'https://example.com/subtrees/deferred-content.bin',
      byteOffset: 0,
      byteLength: 4
    });
    expect(subtree.resourceFiles[0].data).toBeUndefined();
  });

  test('traverses and caches glTF implicit subtrees lazily', async () => {
    const rootUrl = 'https://example.com/draft/root.resource?token=test';
    const subtreeUrl = 'https://example.com/draft/subtrees/0/0/0.resource?token=test';
    const requestedUrls: string[] = [];
    const rootJson = createTilesetGltf({
      extensionsUsed: ['3DTILES_tileset', '3DTILES_implicit_tiling'],
      extensionsRequired: ['3DTILES_tileset', '3DTILES_implicit_tiling'],
      nodes: [
        {
          extensions: {
            '3DTILES_tileset': {geometricError: 16, refine: 'REPLACE'},
            '3DTILES_implicit_tiling': {
              contentUri: 'content/{level}/{x}/{y}.glb',
              subtreeUri: 'subtrees/{level}/{x}/{y}.resource',
              subdivisionScheme: 'QUADTREE',
              availableLevels: 2,
              subtreeLevels: 2
            }
          },
          boundingVolume: {shape: 0},
          scale: [10, 10, 10]
        }
      ]
    });
    const subtreeJson = {
      asset: {version: '2.1'},
      extensionsUsed: ['3DTILES_subtree'],
      extensionsRequired: ['3DTILES_subtree'],
      extensions: {
        '3DTILES_subtree': {
          tileAvailability: {constant: 1},
          contentAvailability: {constant: 1},
          childSubtreeAvailability: {constant: 0}
        }
      }
    };
    const fetch = async (input: RequestInfo | URL): Promise<Response> => {
      const url = input.toString();
      requestedUrls.push(url);
      return new Response(JSON.stringify(url === rootUrl ? rootJson : subtreeJson));
    };

    const rootTileset = await load(rootUrl, Tiles3DLoader, {worker: false, fetch});
    expect(requestedUrls).toEqual([rootUrl]);
    const source = new Tiles3DSource({...rootTileset, coreApi}, {worker: false, fetch});
    const tileset = new Tileset3D(source);
    await tileset.tilesetInitializationPromise;
    const rootHeader = {...rootTileset.root, children: []};
    expect(tileset.root!.lodMetricValue, 'draft errors ignore the node scale').toBe(16);

    await source.loadTileChildren(tileset.root!, {} as never);
    expect(requestedUrls).toEqual([rootUrl, subtreeUrl]);
    expect(tileset.root!.contentUrl).toBe('https://example.com/draft/content/0/0/0.glb');
    expect(tileset.root!.children).toHaveLength(4);

    const duplicateRoot = new Tile3D(tileset, rootHeader);
    await source.loadTileChildren(duplicateRoot, {} as never);
    expect(requestedUrls, 'the second materialization uses the parsed subtree cache').toEqual([
      rootUrl,
      subtreeUrl
    ]);
    expect(source.getImplicitTilingStats().cacheHits).toBe(1);
  });

  test('loads embedded subtree and content files from a draft glTF package', async () => {
    const subtreeBytes = new TextEncoder().encode(
      JSON.stringify({
        asset: {version: '2.1'},
        extensionsUsed: ['3DTILES_subtree'],
        extensionsRequired: ['3DTILES_subtree'],
        extensions: {
          '3DTILES_subtree': {
            tileAvailability: {constant: 1},
            contentAvailability: {constant: 1},
            childSubtreeAvailability: {constant: 0}
          }
        },
        files: [
          {
            uri: 'content/0/0/0.gltf',
            mimeType: 'model/gltf+json',
            name: 'content/0/0/0.gltf'
          },
          {
            uri: 'unused.gltf',
            mimeType: 'model/gltf+json',
            name: 'unused.gltf'
          }
        ]
      })
    );
    const contentBytes = new TextEncoder().encode(
      JSON.stringify({asset: {version: '2.0'}, scenes: [{nodes: []}], scene: 0})
    );
    const contentOffset = alignToFour(subtreeBytes.byteLength);
    const binary = new Uint8Array(contentOffset + contentBytes.byteLength);
    binary.set(subtreeBytes);
    binary.set(contentBytes, contentOffset);
    const packagedTileset = createTilesetGltf({
      extensionsUsed: ['3DTILES_tileset', '3DTILES_implicit_tiling'],
      extensionsRequired: ['3DTILES_tileset', '3DTILES_implicit_tiling'],
      buffers: [{byteLength: binary.byteLength}],
      bufferViews: [
        {buffer: 0, byteOffset: 0, byteLength: subtreeBytes.byteLength},
        {buffer: 0, byteOffset: contentOffset, byteLength: contentBytes.byteLength}
      ],
      files: [
        {bufferView: 0, mimeType: 'model/gltf+json', name: 'subtrees/0/0/0.gltf'},
        {bufferView: 1, mimeType: 'model/gltf+json', name: 'content/0/0/0.gltf'}
      ],
      nodes: [
        {
          extensions: {
            '3DTILES_tileset': {geometricError: 1, refine: 'REPLACE'},
            '3DTILES_implicit_tiling': {
              contentUri: 'content/{level}/{x}/{y}.gltf',
              subtreeUri: 'subtrees/{level}/{x}/{y}.gltf',
              subdivisionScheme: 'QUADTREE',
              availableLevels: 1,
              subtreeLevels: 1
            }
          },
          boundingVolume: {shape: 0}
        }
      ]
    });
    const rootTileset = await parse(encodeGlb(packagedTileset, binary), Tiles3DLoader, {
      worker: false
    });
    const source = new Tiles3DSource({...rootTileset, coreApi}, {worker: false});
    const tileset = new Tileset3D(source);
    await tileset.tilesetInitializationPromise;

    await source.loadTileChildren(tileset.root!, {} as never);
    expect(tileset.root!.header.content._resource.fileIndex).toBe(0);
    expect(tileset.root!.header.content._resource.files[0].data).toBeInstanceOf(ArrayBuffer);
    expect(tileset.root!.header.content._resource.files[1]).toMatchObject({
      name: 'unused.gltf',
      uri: 'gltf-package://0/unused.gltf'
    });
    await tileset.root!.loadContent();
    expect(tileset.root!.content).toMatchObject({shape: 'tile3d'});
  });

  test('rejects malformed draft subtree declarations deterministically', async () => {
    await expect(
      parse(
        encodeJson({
          asset: {version: '2.1'},
          extensionsUsed: ['3DTILES_subtree'],
          extensionsRequired: [],
          extensions: {
            '3DTILES_subtree': {
              tileAvailability: {constant: 1},
              childSubtreeAvailability: {constant: 0}
            }
          }
        }),
        Tiles3DLoader,
        {worker: false}
      )
    ).rejects.toThrow(/3DTILES_subtree must be declared in extensionsRequired/);
    await expect(
      parse(
        encodeJson({
          asset: {version: '2.1'},
          extensionsUsed: ['3DTILES_subtree'],
          extensionsRequired: ['3DTILES_subtree'],
          extensions: {
            '3DTILES_subtree': {
              tileAvailability: {constant: 1},
              childSubtreeAvailability: {constant: 0},
              tileAttributes: {TILE_GEOMETRIC_ERROR: 0}
            }
          },
          accessors: [{componentType: 5126, count: 1, type: 'SCALAR'}]
        }),
        Tiles3DLoader,
        {worker: false}
      )
    ).rejects.toThrow(/TILE_GEOMETRIC_ERROR requires SCALAR\/5130/);
  });

  test('normalizes extended bounds, CRS declarations and georeferencing', async () => {
    const tileset = await parse(
      encodeJson(
        createTilesetGltf({
          extensionsUsed: [
            '3DTILES_tileset',
            '3DTILES_shape_ellipsoid_region',
            '3DTILES_shape_s2',
            '3DTILES_shape_cylinder_region',
            'EXT_geospatial_crs',
            'EXT_geospatial_crs_wkid',
            'EXT_georeference'
          ],
          extensionsRequired: [
            '3DTILES_tileset',
            '3DTILES_shape_ellipsoid_region',
            '3DTILES_shape_s2',
            '3DTILES_shape_cylinder_region',
            'EXT_geospatial_crs',
            'EXT_geospatial_crs_wkid'
          ],
          extensions: {
            '3DTILES_tileset': {geometricError: 16},
            EXT_geospatial_crs: {
              format: 'wkid',
              extensions: {
                EXT_geospatial_crs_wkid: {
                  authority: 'EPSG',
                  wkid: 4978,
                  epoch: '2025.5'
                }
              }
            }
          },
          shapes: [
            {
              type: 'ellipsoid region',
              extensions: {
                '3DTILES_shape_ellipsoid_region': {
                  minimumLongitude: -1,
                  maximumLongitude: 1,
                  minimumLatitude: -0.5,
                  maximumLatitude: 0.5,
                  minimumHeight: 10,
                  maximumHeight: 20
                }
              }
            },
            {
              type: 's2',
              extensions: {
                '3DTILES_shape_s2': {token: '1', minimumHeight: 0, maximumHeight: 100}
              }
            },
            {
              type: 'cylinder region',
              extensions: {
                '3DTILES_shape_cylinder_region': {
                  minimumRadius: 2,
                  maximumRadius: 5,
                  height: 8
                }
              }
            }
          ],
          nodes: [
            {
              extensions: {
                '3DTILES_tileset': {geometricError: 10, refine: 'REPLACE'},
                EXT_georeference: {longitude: 0, latitude: 0, height: 0}
              },
              boundingVolume: {shape: 0},
              translation: [1, 0, 0],
              children: [1, 2]
            },
            {
              extensions: {'3DTILES_tileset': {geometricError: 0}},
              boundingVolume: {shape: 1}
            },
            {
              extensions: {'3DTILES_tileset': {geometricError: 0}},
              boundingVolume: {shape: 2, translation: [1, 2, 3]}
            }
          ]
        })
      ),
      Tiles3DLoader,
      {worker: false}
    );

    expect(tileset.root.boundingVolume.region).toEqual([-1, -0.5, 1, 0.5, 10, 20]);
    expect(tileset.root.transform.slice(12, 15)).toEqual([6378137, -1, 0]);
    expect(tileset.root.children[0].boundingVolume).toMatchObject({
      box: expect.any(Array),
      s2VolumeInfo: {token: '1', minimumHeight: 0, maximumHeight: 100}
    });
    expect(tileset.root.children[1].boundingVolume.box).toEqual([
      1, 2, 3, 5, 0, 0, 0, 4, 0, 0, 0, 5
    ]);
    expect(tileset.spatialMetadata).toMatchObject({
      sourceCrs: 'EPSG:4978',
      coordinateEpoch: 2025.5,
      coordinateFrame: 'geocentric',
      warnings: []
    });
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
