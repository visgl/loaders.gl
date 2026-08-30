// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {fetchFile} from '@loaders.gl/core';
import {I3SPointCloudSource} from '@loaders.gl/i3s';
import {describe, expect, test} from 'vitest';

const XYZ_FIXTURE = '@loaders.gl/i3s/test/data/point-cloud/SMALL_AUTZEN_LAS_All.pccxyz';
const INTENSITY_FIXTURE = '@loaders.gl/i3s/test/data/point-cloud/SMALL_AUTZEN_LAS_All.pccint';

test('I3SPointCloudSource traverses node pages and decodes content', async () => {
  const [xyzResponse, intensityResponse] = await Promise.all([
    fetchFile(XYZ_FIXTURE),
    fetchFile(INTENSITY_FIXTURE)
  ]);
  const resources = new Map<string, ArrayBuffer>([
    [
      'https://example.com/layer',
      new TextEncoder().encode(
        JSON.stringify({
          id: 1,
          layerType: 'PointCloud',
          version: '2.1',
          spatialReference: {wkid: 4326},
          capabilities: [],
          disablePopup: false,
          store: {
            profile: 'pointcloud',
            version: '2.1',
            index: {nodePerIndexBlock: 2},
            defaultGeometrySchema: {geometryType: 'points', encoding: 'lepcc-xyz'}
          },
          nodePages: {rootIndex: 0, lodSelectionMetricType: 'density-threshold'},
          attributeStorageInfo: [
            {key: 'intensity', name: 'intensity', encoding: 'lepcc-intensity', resource: 0},
            {
              key: 'classification',
              name: 'classification',
              resource: 0,
              attributeValues: {valueType: 'UInt16', valuesPerElement: 1}
            }
          ]
        })
      ).buffer
    ],
    [
      'https://example.com/layer/nodepages/0',
      new TextEncoder().encode(
        JSON.stringify({
          nodes: [
            {
              resourceId: 0,
              obb: {
                center: [179.999, 0, 0],
                halfSize: [20000, 20000, 10],
                quaternion: [0, 0, 0, 1]
              },
              vertexCount: 106,
              firstChild: 1,
              childCount: 1,
              lodThreshold: 1
            },
            {
              resourceId: 1,
              obb: {center: [1, 1, 1], halfSize: [1, 1, 1], quaternion: [0, 0, 0, 1]},
              vertexCount: 106
            }
          ]
        })
      ).buffer
    ],
    ['https://example.com/layer/nodes/0/geometries/0', await xyzResponse.arrayBuffer()],
    [
      'https://example.com/layer/nodes/0/attributes/intensity/0',
      await intensityResponse.arrayBuffer()
    ],
    [
      'https://example.com/layer/nodes/0/attributes/classification/0',
      Uint16Array.from({length: 106}, () => 7).buffer
    ]
  ]);

  const fetchResource = async (url: string) => new Response(resources.get(url));
  const source = new I3SPointCloudSource('https://example.com/layer', {
    core: {loadOptions: {core: {fetch: fetchResource}}}
  });
  const root = await source.getRootTile();
  expect(root.id).toBe('0');
  expect(root.lodSelectionMetricType).toBe('density-threshold');
  expect(root.boundingVolume.wrapsDateline).toBe(true);
  expect(root.boundingVolume.coversFullLongitude).toBe(false);
  expect(root.boundingVolume.cartographicBounds[1][0]).toBeLessThan(0.001);
  expect((await source.getChildren(root)).map(tile => tile.id)).toEqual(['1']);
  const content = await source.loadTileContent(root);
  expect(content?.pointCount).toBe(106);
  expect(content?.data.topology).toBe('point-list');
  expect(content?.data.data.schema.fields.map(field => field.name)).toEqual([
    'POSITION',
    'intensity',
    'classification'
  ]);
  expect(content?.coordinateSystem).toBe('lnglat-offsets');
  expect(content?.data.data.getChild('classification')?.get(0)).toBe(7);

  const cartesianSource = new I3SPointCloudSource('https://example.com/layer', {
    i3s: {coordinateSystem: 'cartesian'},
    core: {loadOptions: {core: {fetch: fetchResource}}}
  });
  const cartesianRoot = await cartesianSource.getRootTile();
  (cartesianSource as any).decoder.decodeXyz = () => new Float64Array(106 * 3);
  const cartesianContent = await cartesianSource.loadTileContent(cartesianRoot);
  const firstPosition = cartesianContent?.data.data.getChild('POSITION')?.get(0) as
    | Iterable<number>
    | undefined;
  expect(cartesianContent?.coordinateSystem).toBe('cartesian');
  expect(firstPosition ? Array.from(firstPosition)[0] : 0).toBeGreaterThan(6_000_000);

  const transformedSource = new I3SPointCloudSource('https://example.com/layer', {
    spatial: {targetCrs: 'EPSG:3857'},
    core: {loadOptions: {core: {fetch: fetchResource}}}
  });
  const transformedRoot = await transformedSource.getRootTile();
  const transformedPositions = new Float64Array(106 * 3);
  for (let index = 0; index < transformedPositions.length; index += 3) {
    transformedPositions.set([179.999, 0, 0], index);
  }
  (transformedSource as any).decoder.decodeXyz = () => transformedPositions;
  const transformedContent = await transformedSource.loadTileContent(transformedRoot);
  const transformedFirstPosition = transformedContent?.data.data.getChild('POSITION')?.get(0) as
    | Iterable<number>
    | undefined;

  expect(transformedRoot.boundingVolume.coordinateFrame).toBe('geographic');
  expect(transformedRoot.spatialBoundingVolume?.coordinateFrame).toBe('cartesian');
  expect(transformedContent?.coordinateSystem).toBe('cartesian');
  expect(transformedContent?.spatialReference).toMatchObject({
    targetCrs: 'EPSG:3857',
    status: 'transformed'
  });
  expect(transformedFirstPosition ? Array.from(transformedFirstPosition) : []).toEqual([0, 0, 0]);
  expect(transformedContent?.spatialBoundingVolume).toBe(transformedRoot.spatialBoundingVolume);
  expect(Array.from(transformedContent?.modelMatrix || []).slice(12, 13)[0]).toBeGreaterThan(
    20_000_000
  );

  const geographicTransformedSource = new I3SPointCloudSource('https://example.com/layer', {
    spatial: {targetCrs: 'EPSG:4326'},
    core: {loadOptions: {core: {fetch: fetchResource}}}
  });
  const geographicTransformedRoot = await geographicTransformedSource.getRootTile();
  expect(geographicTransformedRoot.spatialBoundingVolume?.coordinateFrame).toBe('geographic');
  expect(geographicTransformedRoot.spatialBoundingVolume?.wrapsDateline).toBe(true);
  expect(geographicTransformedRoot.spatialBoundingVolume?.coversFullLongitude).toBe(false);

  resources.set(
    'https://example.com/layer',
    new TextEncoder().encode(
      JSON.stringify({
        id: 1,
        layerType: 'PointCloud',
        version: '2.1',
        spatialReference: {wkid: 4326},
        heightModelInfo: {heightModel: 'ellipsoidal', heightUnit: 'meter'},
        elevationInfo: {mode: 'relativeToGround', offset: 2, unit: 'meter'},
        capabilities: [],
        disablePopup: false,
        store: {
          profile: 'pointcloud',
          version: '2.1',
          index: {nodePerIndexBlock: 2},
          defaultGeometrySchema: {geometryType: 'points', encoding: 'lepcc-xyz'}
        },
        nodePages: {rootIndex: 0, lodSelectionMetricType: 'density-threshold'},
        attributeStorageInfo: []
      })
    ).buffer
  );
  let sampledPositionCount = 0;
  const terrainElevationProvider = {
    sampleElevations(positions: readonly (readonly [number, number])[]) {
      sampledPositionCount += positions.length;
      return Promise.resolve(positions.map(() => 50));
    },
    getElevationRange() {
      return Promise.resolve({minimum: 50, maximum: 50});
    }
  };
  const placedSource = new I3SPointCloudSource('https://example.com/layer', {
    spatial: {targetCrs: 'EPSG:4326', terrainElevationProvider},
    core: {loadOptions: {core: {fetch: fetchResource}}}
  });
  const placedRoot = await placedSource.getRootTile();
  const placedPositions = new Float64Array(106 * 3);
  for (let index = 0; index < placedPositions.length; index += 3) {
    placedPositions.set([179.999, 0, 5], index);
  }
  (placedSource as any).decoder.decodeXyz = () => placedPositions;
  const placedContent = await placedSource.loadTileContent(placedRoot);
  const placedFirstPosition = placedContent?.data.data.getChild('POSITION')?.get(0) as
    | Iterable<number>
    | undefined;

  expect(sampledPositionCount).toBeGreaterThan(8);
  expect(placedContent?.cartographicOrigin[2]).toBeCloseTo(52, 8);
  expect(placedFirstPosition ? Array.from(placedFirstPosition)[2] : undefined).toBeCloseTo(5, 5);

  resources.set(
    'https://example.com/layer',
    new TextEncoder().encode(
      JSON.stringify({
        id: 1,
        layerType: 'PointCloud',
        version: '2.1',
        spatialReference: {wkid: 4326},
        heightModelInfo: {heightModel: 'ellipsoidal', heightUnit: 'furlong'},
        capabilities: [],
        disablePopup: false,
        store: {
          profile: 'pointcloud',
          version: '2.1',
          index: {nodePerIndexBlock: 2},
          defaultGeometrySchema: {geometryType: 'points', encoding: 'lepcc-xyz'}
        },
        nodePages: {rootIndex: 0, lodSelectionMetricType: 'density-threshold'},
        attributeStorageInfo: []
      })
    ).buffer
  );
  const invalidVerticalSource = new I3SPointCloudSource('https://example.com/layer', {
    core: {loadOptions: {core: {fetch: fetchResource}}}
  });

  await expect(invalidVerticalSource.initialize()).rejects.toThrow(
    'Unsupported I3S vertical unit furlong'
  );
});

describe('I3SPointCloudSource boundary coverage', () => {
  const node = {
    resourceId: 7,
    obb: {center: [10, 20, 30], halfSize: [1, 2, 3], quaternion: [0, 0, 0, 1]},
    vertexCount: 1,
    lodThreshold: 0
  };

  function makeInitializedSource(
    coordinateSystem?: 'default' | 'cartesian' | 'lnglat' | 'lnglat-offsets' | 'meter-offsets',
    fetchResource: (url: string) => Promise<Response> = async () => new Response(new ArrayBuffer(8))
  ) {
    const source = new I3SPointCloudSource('https://example.com/layer///', {
      i3s: {coordinateSystem},
      core: {loadOptions: {core: {fetch: fetchResource}}}
    });
    source.isReady = true;
    source.metadata = {
      layerType: 'PointCloud',
      store: {},
      nodePages: {},
      attributeInfo: []
    } as any;
    (source as any).baseUrl = 'https://example.com/layer';
    (source as any).nodes.set('0', node);
    (source as any).decoder.decodeXyz = () => new Float64Array([11, 22, 33]);
    return source;
  }

  test('normalizes every renderer coordinate system with tiny synthetic content', async () => {
    const expected = {
      default: {system: 'lnglat-offsets', origin: [10, 20, 30]},
      'lnglat-offsets': {system: 'lnglat-offsets', origin: [10, 20, 30]},
      lnglat: {system: 'lnglat', origin: [0, 0, 0]},
      'meter-offsets': {system: 'meter-offsets', origin: [10, 20, 30]},
      cartesian: {system: 'cartesian', origin: [0, 0, 0]}
    } as const;
    for (const coordinateSystem of Object.keys(expected) as Array<keyof typeof expected>) {
      const source = makeInitializedSource(coordinateSystem);
      const tile = await source.getRootTile();
      const content = await source.loadTileContent(tile);
      expect(content?.coordinateSystem).toBe(expected[coordinateSystem].system);
      expect(content?.cartographicOrigin).toEqual(expected[coordinateSystem].origin);
      expect(content?.pointCount).toBe(1);
    }
  });

  test('decodes raw point attributes and resolves their public names', () => {
    const source = makeInitializedSource();
    const sourceInternals = source as any;
    sourceInternals.decoder.getBlobType = () => {
      throw new Error('not compressed');
    };
    const cases = [
      ['Float32', new Float32Array([1, 2]).buffer, Float32Array],
      ['Float64', new Float64Array([1, 2]).buffer, Float64Array],
      ['UInt16', new Uint16Array([1, 2]).buffer, Uint16Array],
      ['Int32', new Int32Array([1, 2]).buffer, Int32Array],
      ['UInt8', new Uint8Array([1, 2]).buffer, Uint8Array]
    ] as const;
    for (const [valueType, bytes, constructor] of cases) {
      const decoded = sourceInternals.decodeAttribute(bytes, {
        name: 'custom',
        attributeValues: {valueType, valuesPerElement: 2}
      });
      expect(decoded.value).toBeInstanceOf(constructor);
      expect(decoded.size).toBe(2);
      expect(sourceInternals.getAttributeName({name: 'custom'}, decoded.kind)).toBe('custom');
    }

    sourceInternals.decoder.getBlobType = () => 'rgb';
    sourceInternals.decoder.decodeRgb = () => new Uint8Array([1, 2, 3]);
    expect(sourceInternals.decodeAttribute(new ArrayBuffer(1), {}).kind).toBe('rgb');
    sourceInternals.decoder.getBlobType = () => 'intensity';
    sourceInternals.decoder.decodeIntensity = () => new Uint16Array([4]);
    expect(sourceInternals.decodeAttribute(new ArrayBuffer(1), {}).kind).toBe('intensity');
    sourceInternals.decoder.getBlobType = () => 'flagBytes';
    sourceInternals.decoder.decodeFlagBytes = () => new Uint8Array([5]);
    expect(sourceInternals.decodeAttribute(new ArrayBuffer(1), {}).kind).toBe('flags');
    expect(sourceInternals.getAttributeName({}, 'rgb')).toBe('COLOR_0');
    expect(sourceInternals.getAttributeName({}, 'intensity')).toBe('intensity');
    expect(sourceInternals.getAttributeName({}, 'flagBytes')).toBe('flags');
    expect(sourceInternals.getAttributeName({key: 'key'}, 'raw')).toBe('key');
    expect(sourceInternals.getAttributeName({}, 'raw')).toBe('attribute');
  });

  test('covers hierarchy caches, absent content, request fallbacks, and count checks', async () => {
    const requestedUrls: string[] = [];
    const source = makeInitializedSource(undefined, async url => {
      requestedUrls.push(url);
      if (url.includes('/first/') || url.endsWith('/missing')) {
        return new Response(null, {status: 404});
      }
      return new Response(Uint8Array.from([1, 2, 3]));
    });
    const sourceInternals = source as any;
    expect(await source.getMetadata()).toBe(source.metadata);
    const root = await source.getRootTile();
    expect(await source.getRootTile()).toBe(root);
    expect(await source.getChildren(root)).toEqual([]);
    expect(source.getViewState()).toEqual({});
    source.metadata = {...source.metadata, fullExtent: {xmin: 1, ymin: 2}} as any;
    expect(source.getViewState()).toEqual({cartographicCenter: [1, 2, 0]});

    sourceInternals.nodes.delete('0');
    expect(await source.loadTileContent(root)).toBeNull();
    sourceInternals.nodes.set('0', node);
    sourceInternals.decoder.decodeXyz = () => new Float64Array(0);
    await expect(source.loadTileContent(root)).rejects.toThrow(/geometry count mismatch/);

    expect(sourceInternals.resourceCandidates('nodes/0/attributes/first/0', 'second')).toEqual([
      'nodes/0/attributes/first/0',
      'nodes/0/attributes/second/0'
    ]);
    expect(
      await sourceInternals.readBinary([
        'nodes/0/attributes/first/0',
        'nodes/0/attributes/second/0'
      ])
    ).toBeInstanceOf(ArrayBuffer);
    expect(requestedUrls.slice(-2)).toEqual([
      'https://example.com/layer/nodes/0/attributes/first/0',
      'https://example.com/layer/nodes/0/attributes/second/0'
    ]);
    expect(await sourceInternals.readBinaryOptional('missing')).toBeNull();

    sourceInternals.nodes.clear();
    sourceInternals.nodePages.set(0, {nodes: []});
    await expect(sourceInternals.getNode(0)).rejects.toThrow(/is not present/);
  });

  test('initializes REST metadata once and reports unresolved resource failures', async () => {
    let requestCount = 0;
    const layer = {
      id: 1,
      layerType: 'PointCloud',
      version: '2.1',
      spatialReference: {wkid: 4326},
      capabilities: [],
      disablePopup: false,
      store: {
        profile: 'pointcloud',
        version: '2.1',
        index: {nodePerIndexBlock: 1},
        defaultGeometrySchema: {geometryType: 'points', encoding: 'lepcc-xyz'}
      },
      nodePages: {rootIndex: 0},
      attributeStorageInfo: []
    };
    const source = new I3SPointCloudSource('https://example.com/layer///', {
      i3s: {token: 'secret'},
      core: {
        loadOptions: {
          core: {
            fetch: async (url: string) => {
              requestCount++;
              return new Response(new TextEncoder().encode(JSON.stringify(layer)));
            }
          }
        }
      }
    });
    await source.initialize();
    await source.initialize();
    expect(requestCount).toBe(1);
    expect((source as any).baseUrl).toBe('https://example.com/layer');
    expect((source as any).nodesPerPage).toBe(1);

    const failingSource = makeInitializedSource(undefined, async () => {
      throw 'failure';
    });
    await expect((failingSource as any).readBinary('missing')).rejects.toThrow(
      'I3S resource request failed'
    );
  });
});
