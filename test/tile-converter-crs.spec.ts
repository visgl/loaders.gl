// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {transformPointCloudSourceTile as transformRootPointTile} from '@loaders.gl/tile-converter/v5';
import type {Geoid} from '@math.gl/geoid';
import {Matrix4} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {parse} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles/bundled';
import {GLTFLoader} from '@loaders.gl/gltf/bundled';
import {GLTFScenegraph} from '@loaders.gl/gltf';
import {convertTableToMesh, makeMeshArrowTable, deduceMeshSchema} from '@loaders.gl/schema-utils';
import {
  createTilesetSpatialReference,
  getI3SSpatialReference,
  registerSpatialCrs
} from '@loaders.gl/tiles';
import type {PointCloudTilesetSource} from '@loaders.gl/tiles';
import {
  createI3SConversionSpatialContext,
  createTiles3DConversionSpatialContext,
  createMeshConversionCodec,
  createI3SMeshConversionCodec,
  createPointCloudTilesetSink,
  transformPointCloudSourceTile,
  encodePointCloudSource,
  convertPointCloudSource,
  type PointCloudSourceTile
} from '@loaders.gl/tile-converter/v5/browser';

/** Native geographic source metadata with explicitly declared heights. */
const SOURCE_REFERENCE = createTilesetSpatialReference({
  sourceCrs: 'EPSG:4326',
  heightReference: 'ellipsoidal',
  axisOrder: 'xyz'
});
/** Source-to-ECEF operation shared by the point fixtures. */
const SPATIAL = createI3SConversionSpatialContext(SOURCE_REFERENCE, {targetCrs: 'EPSG:4978'});

/** Tiny Arrow source tile whose placement can be varied independently of its traversal bounds. */
function createTile(): {
  header: PointCloudSourceTile['header'];
  content: NonNullable<PointCloudSourceTile['content']>;
} {
  return {
    header: {
      id: 'point',
      level: 0,
      pointCount: 2,
      geometricError: 1,
      boundingVolume: {
        cartographicBounds: [
          [0, 0, 0],
          [1, 1, 1]
        ],
        center: [0, 0, 0],
        radius: 1
      }
    },
    content: {
      data: makeMeshArrowTable({
        POSITION: {value: new Float64Array([0, 0, 10.000001, 0.000001, 0, 11.000001]), size: 3},
        COLOR_0: {value: new Uint8Array([255, 0, 0, 0, 255, 0]), size: 3}
      }),
      pointCount: 2,
      coordinateSystem: 'lnglat-offsets',
      cartographicOrigin: [10, 20, 30],
      spatialReference: SOURCE_REFERENCE
    }
  };
}

/** Structural source fixture with no network, camera or renderer state. */
function createSource(tile = createTile()): PointCloudTilesetSource {
  return {
    isReady: true,
    initialize: async () => {},
    getRootTile: async () => tile.header,
    getChildren: async () => [],
    loadTileContent: async () => tile.content
  } as unknown as PointCloudTilesetSource;
}

/** Extracts packed doubles from prepared Arrow point content. */
function getPositions(tile: PointCloudSourceTile): number[] {
  return Array.from(convertTableToMesh(tile.content!.data).attributes.POSITION.value);
}

test('geographic point offsets convert once, preserve attributes, and produce measured ECEF bounds', async () => {
  expect(transformRootPointTile).toBe(transformPointCloudSourceTile);
  const tile = createTile();
  const original = getPositions(tile);
  const transformed = await transformPointCloudSourceTile(tile, {spatialContext: SPATIAL});
  const positions = getPositions(transformed);
  const expected = Ellipsoid.WGS84.cartographicToCartesian([10, 20, 40.000001]);
  expected.forEach((value, axis) => expect(positions[axis]).toBeCloseTo(value, 8));
  expect(transformed.header).toBe(tile.header);
  expect(transformed.content).toMatchObject({
    coordinateSystem: 'cartesian',
    cartographicOrigin: [0, 0, 0],
    modelMatrix: undefined,
    spatialReference: SPATIAL.spatialReference
  });
  const mesh = convertTableToMesh(transformed.content!.data);
  expect(mesh.attributes.POSITION.value).toBeInstanceOf(Float64Array);
  expect(Array.from(mesh.attributes.COLOR_0.value)).toEqual([255, 0, 0, 0, 255, 0]);
  expect(getPositions(tile)).toEqual(original);
  for (let axis = 0; axis < 3; axis++) {
    expect(transformed.content!.spatialBoundingVolume!.cartographicBounds[0][axis]).toBe(
      Math.min(positions[axis], positions[axis + 3])
    );
    expect(transformed.content!.spatialBoundingVolume!.cartographicBounds[1][axis]).toBe(
      Math.max(positions[axis], positions[axis + 3])
    );
  }
  await expect(
    transformPointCloudSourceTile(transformed, {spatialContext: SPATIAL})
  ).rejects.toMatchObject({code: 'POINT_CLOUD_SPATIAL_REFERENCE_MISMATCH'});
});

test('point conversion integrates target RTC precision with tileset packaging', async () => {
  const sink = createPointCloudTilesetSink({
    maxTiles: 1,
    maxTotalBytes: 10000,
    geometricError: 0.001
  });
  const report = await convertPointCloudSource(createSource(), {
    sink,
    spatialContext: SPATIAL,
    measureInputBytes: () => 64,
    getTileEncodingOptions: tile => ({
      rtcCenter: getPositions(tile).slice(0, 3) as [number, number, number],
      maxPositionError: 0.001
    })
  });
  expect(report).toMatchObject({state: 'completed', inputResources: 1, outputResources: 1});
  const files = sink.getFiles();
  const parsed = await parse(await files[0].blob.arrayBuffer(), Tiles3DLoader, {worker: false});
  expect(parsed.rtcCenter![0]).toBeGreaterThan(5000000);
  expect(Array.from(parsed.attributes.positions!).slice(0, 3)).toEqual([0, 0, 0]);
  expect(JSON.parse(await files[1].blob.text()).root.children[0].transform).toBeUndefined();
  const resources = [];
  for await (const resource of encodePointCloudSource(createSource(), {spatialContext: SPATIAL}))
    resources.push(resource);
  expect(resources[0].coordinateSystem).toBe('cartesian');
  expect(resources[0].spatialReference).toBe(SPATIAL.spatialReference);
});

test('projected point placement precedes units, geoid and CRS conversion', async () => {
  const tile = createTile();
  const source = createTilesetSpatialReference({
    sourceCrs: 'EPSG:3857',
    coordinateFrame: 'projected',
    heightReference: 'orthometric',
    verticalUnitScale: 0.3048,
    axisOrder: 'xyz'
  });
  const spatialContext = createI3SConversionSpatialContext(source, {
    targetCrs: 'EPSG:4978',
    targetHeightReference: 'ellipsoidal',
    geoidModel: {getHeight: () => 30} as Geoid
  });
  tile.content = {
    ...tile.content!,
    data: makeMeshArrowTable({
      POSITION: {value: new Float64Array([0, 0, 100, 1, 0, 101]), size: 3}
    }),
    coordinateSystem: 'cartesian',
    cartographicOrigin: [0, 0, 0],
    modelMatrix: Array.from(new Matrix4().translate([1113194.9079327357, 0, 0])),
    spatialReference: source
  };
  const output = await transformPointCloudSourceTile(tile, {spatialContext});
  const expected = Ellipsoid.WGS84.cartographicToCartesian([10, 0, 60.48]);
  expected.forEach((value, axis) => expect(getPositions(output)[axis]).toBeCloseTo(value, 7));
});

test('geographic output uses absolute longitude/latitude and native contexts retain doubles', async () => {
  const tile = createTile();
  tile.content = {
    ...tile.content!,
    coordinateSystem: 'lnglat',
    cartographicOrigin: [0, 0, 0],
    spatialReference: undefined
  };
  const spatialContext = createI3SConversionSpatialContext(SOURCE_REFERENCE);
  const output = await transformPointCloudSourceTile(tile, {spatialContext});
  expect(getPositions(output)).toEqual(getPositions(tile));
  expect(output.content!.coordinateSystem).toBe('lnglat');
  expect(output.content!.spatialBoundingVolume!.coordinateFrame).toBe('geographic');
});

test('quantized points are decoded before spatial conversion and their transform is cleared', async () => {
  const tile = createTile();
  const attributes = {
    POSITION: {
      value: new Uint16Array([0, 0, 0, 65535, 0, 0]),
      size: 3,
      transform: {type: 'quantization' as const, origin: [0, 0, 1], bits: 16, range: 0.001}
    }
  };
  tile.content = {
    ...tile.content,
    data: makeMeshArrowTable(attributes, {schema: deduceMeshSchema(attributes)}),
    cartographicOrigin: [0, 0, 0]
  };
  const output = await transformPointCloudSourceTile(tile, {spatialContext: SPATIAL});
  expect(getPositions(output)[0]).toBeCloseTo(6378138, 8);
  expect(getPositions(output)[4]).toBeCloseTo(
    Ellipsoid.WGS84.cartographicToCartesian([0.001, 0, 1])[1],
    8
  );
  expect(convertTableToMesh(output.content!.data).attributes.POSITION.transform).toBeUndefined();
});

test('point normals require an explicit frame and are transformed without mutating source vectors', async () => {
  const tile = createTile();
  tile.content = {
    ...tile.content!,
    data: makeMeshArrowTable({
      POSITION: {value: new Float64Array([0, 0, 0]), size: 3},
      NORMAL: {value: new Float32Array([0, 0, 2]), size: 3}
    }),
    cartographicOrigin: [0, 0, 0],
    pointCount: 1
  };
  await expect(
    transformPointCloudSourceTile(tile, {spatialContext: SPATIAL})
  ).rejects.toMatchObject({code: 'POINT_CLOUD_NORMAL_FRAME_REQUIRED'});
  const output = await transformPointCloudSourceTile(tile, {
    spatialContext: SPATIAL,
    normalReferenceFrame: 'vertex-reference-frame'
  });
  expect(Array.from(convertTableToMesh(output.content!.data).attributes.NORMAL.value)).toEqual([
    1, 0, 0
  ]);
  expect(Array.from(convertTableToMesh(tile.content!.data).attributes.NORMAL.value)).toEqual([
    0, 0, 2
  ]);
  tile.content!.data = makeMeshArrowTable({
    POSITION: {value: new Float64Array([0, 0, 0]), size: 3},
    NORMAL: {value: new Float32Array([0, 0, 0]), size: 3}
  });
  await expect(
    transformPointCloudSourceTile(tile, {
      spatialContext: SPATIAL,
      normalReferenceFrame: 'earth-centered'
    })
  ).rejects.toMatchObject({code: 'POINT_CLOUD_NORMAL_INVALID'});
});

test.each([
  [
    'POINT_CLOUD_SOURCE_FRAME_UNSUPPORTED',
    (tile: PointCloudSourceTile) => {
      tile.content!.coordinateSystem = 'meter-offsets';
    }
  ],
  [
    'POINT_CLOUD_SOURCE_ORIGIN_INVALID',
    (tile: PointCloudSourceTile) => {
      tile.content!.cartographicOrigin = [NaN, 0, 0];
    }
  ],
  [
    'POINT_CLOUD_SOURCE_PLACEMENT_UNSUPPORTED',
    (tile: PointCloudSourceTile) => {
      tile.content!.modelMatrix = Array.from(new Matrix4().translate([1, 0, 0]));
    }
  ],
  [
    'POINT_CLOUD_SPATIAL_REFERENCE_MISMATCH',
    (tile: PointCloudSourceTile) => {
      tile.content!.spatialReference = {...SOURCE_REFERENCE, sourceCrs: 'EPSG:3857'};
    }
  ],
  [
    'POINT_CLOUD_SPATIAL_REFERENCE_MISMATCH',
    (tile: PointCloudSourceTile) => {
      tile.content!.spatialReference = {...SOURCE_REFERENCE, coordinateEpoch: 2020};
    }
  ],
  [
    'POINT_CLOUD_POSITION_INVALID',
    (tile: PointCloudSourceTile) => {
      tile.content!.data = makeMeshArrowTable({
        POSITION: {value: new Float64Array([NaN, 0, 0]), size: 3}
      });
    }
  ]
])('point preparation rejects %s', async (code, mutate) => {
  const tile = createTile();
  mutate(tile);
  await expect(
    transformPointCloudSourceTile(tile, {spatialContext: SPATIAL})
  ).rejects.toMatchObject({code});
});

test('cancellation during elevation sampling aborts output and prevents traversal advancement', async () => {
  const controller = new AbortController();
  const spatialContext = createI3SConversionSpatialContext(
    {...SOURCE_REFERENCE, elevationMode: 'relativeToGround'},
    {
      targetCrs: 'EPSG:4978',
      terrainElevationProvider: {
        sampleElevations: async positions => {
          controller.abort(new Error('cancel elevation'));
          return positions.map(() => 10);
        },
        getElevationRange: async () => ({minimum: 10, maximum: 10})
      }
    }
  );
  const tile = createTile();
  tile.content!.spatialReference = undefined;
  const sink = {write: vi.fn(), finalize: vi.fn(), abort: vi.fn()};
  await expect(
    convertPointCloudSource(createSource(tile), {
      sink,
      spatialContext,
      signal: controller.signal,
      measureInputBytes: () => 64
    })
  ).rejects.toThrow('cancel elevation');
  expect(sink.write).not.toHaveBeenCalled();
  expect(sink.finalize).not.toHaveBeenCalled();
  expect(sink.abort).toHaveBeenCalledOnce();
  expect(
    await transformPointCloudSourceTile({...tile, content: null}, {spatialContext: SPATIAL})
  ).toEqual({...tile, content: null});
});

test('projected I3S geometry writes GLB and I3S without intermediate float32 offsets', async () => {
  const spatialContext = createI3SConversionSpatialContext(
    getI3SSpatialReference({
      spatialReference: {wkid: 3857},
      heightModelInfo: {heightModel: 'ellipsoidal', heightUnit: 'foot'},
      elevationInfo: {mode: 'absoluteHeight', offset: 10, unit: 'foot'}
    }),
    {targetCrs: 'EPSG:4978'}
  );
  const source = new Float64Array([0, 0, 100.000001, 100, 0, 100.000001, 0, 100, 100.000001]);
  const resource = {
    id: 'projected',
    origin: [6378137 + 33.5280003048, 0, 0] as const,
    mesh: {
      topology: 'triangle-list' as const,
      mode: 4,
      attributes: {
        POSITION: {value: source, size: 3},
        NORMAL: {value: new Float32Array([1, 0, 0, 1, 0, 0, 1, 0, 0]), size: 3}
      }
    }
  };
  const codec = createMeshConversionCodec({
    spatialContext,
    maxPositionError: 0.00001,
    draco: false
  });
  const output = (await (await codec.convert(resource, undefined))[Symbol.asyncIterator]().next())
    .value!;
  const parsed = await parse(output.glb, GLTFLoader, {worker: false});
  const positions = new GLTFScenegraph(parsed).getTypedArrayForAccessor(0);
  expect(Math.abs(positions[0])).toBeLessThan(1e-8);
  expect(output.origin[0] + positions[0]).toBeCloseTo(6378137 + 33.5280003048, 8);
  expect(output.spatialReference.status).toBe('transformed');
  const i3sCodec = createI3SMeshConversionCodec({
    spatialContext,
    draco: false,
    maxPositionError: 0.001,
    maxResourceBytes: 16384
  });
  const layer = (await (await i3sCodec.convert(resource, undefined))[Symbol.asyncIterator]().next())
    .value!;
  expect(layer.maximumPositionError).toBeLessThan(0.001);
  expect(Object.keys(layer.files)).toContain('3dSceneLayer.json.gz');
  expect(source[2]).toBe(100.000001);
});

test('registered UTM definitions participate in the same double-precision conversion path', async () => {
  registerSpatialCrs('EPSG:25832', '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs');
  const context = createI3SConversionSpatialContext(
    {
      sourceCrs: 'EPSG:25832',
      heightReference: 'ellipsoidal',
      coordinateFrame: 'projected',
      axisOrder: 'xyz'
    },
    {targetCrs: 'EPSG:4978'}
  );
  const output = await context.transformGeometryAsync([500000, 0, 0]);
  const expected = Ellipsoid.WGS84.cartographicToCartesian([9, 0, 0]);
  expected.forEach((value, axis) => expect(output.positions[axis]).toBeCloseTo(value, 6));
  expect(() =>
    createI3SConversionSpatialContext(
      {sourceCrs: 'missing-crs', heightReference: 'ellipsoidal'},
      {targetCrs: 'EPSG:4978'}
    )
  ).toThrow(expect.objectContaining({code: 'SPATIAL_REFERENCE_UNRESOLVED'}));
});

test('native local coordinates retain placement without requiring an invented CRS', async () => {
  const tile = createTile();
  tile.content = {
    ...tile.content,
    coordinateSystem: 'cartesian',
    cartographicOrigin: [0, 0, 0],
    spatialReference: undefined,
    modelMatrix: Array.from(new Matrix4().translate([10, 20, 30]))
  };
  const spatialContext = createI3SConversionSpatialContext({coordinateFrame: 'local'});
  const output = await transformPointCloudSourceTile(tile, {spatialContext});
  expect(getPositions(output).slice(0, 3)).toEqual([10, 20, 40.000001]);
  expect(output.content!.spatialBoundingVolume!.coordinateFrame).toBe('cartesian');
});

test('antimeridian point placements remain adjacent in ECEF', async () => {
  const tile = createTile();
  tile.content = {
    ...tile.content,
    data: makeMeshArrowTable({
      POSITION: {value: new Float64Array([0, 0, 0, 0.0002, 0, 0]), size: 3}
    }),
    cartographicOrigin: [179.9999, 0, 0]
  };
  const output = await transformPointCloudSourceTile(tile, {spatialContext: SPATIAL});
  expect(output.content!.spatialBoundingVolume!.radius).toBeLessThan(12);
  expect(getPositions(output)[0]).toBeLessThan(-6378136);
});

test('epoch-tagged reprojection fails explicitly while native epoch metadata is retained', () => {
  const reference = {...SOURCE_REFERENCE, coordinateEpoch: 2020};
  expect(createI3SConversionSpatialContext(reference).spatialReference.coordinateEpoch).toBe(2020);
  for (const createContext of [
    createI3SConversionSpatialContext,
    createTiles3DConversionSpatialContext
  ]) {
    expect(() => createContext(reference, {targetCrs: 'EPSG:4978'})).toThrow(
      expect.objectContaining({code: 'SPATIAL_EPOCH_UNSUPPORTED'})
    );
  }
});

test.each(
  [
    [1, 2, 3],
    Array.from(new Matrix4().scale([0, 1, 1])),
    Array.from(new Matrix4(), (value, index) => (index === 3 ? 1 : value)),
    Array.from(new Matrix4(), (value, index) => (index === 0 ? NaN : value))
  ].map(modelMatrix => ({modelMatrix}))
)('invalid Cartesian placements fail with a typed diagnostic', async ({modelMatrix}) => {
  const tile = createTile();
  tile.content = {
    ...tile.content,
    coordinateSystem: 'cartesian',
    cartographicOrigin: [0, 0, 0],
    spatialReference: undefined,
    modelMatrix
  };
  const spatialContext = createI3SConversionSpatialContext(
    {sourceCrs: 'EPSG:3857', heightReference: 'ellipsoidal'},
    {targetCrs: 'EPSG:4978'}
  );
  await expect(transformPointCloudSourceTile(tile, {spatialContext})).rejects.toMatchObject({
    code: 'POINT_CLOUD_SOURCE_PLACEMENT_UNSUPPORTED'
  });
});

test('native projected mesh coordinates and CRS are retained without implicit reprojection', async () => {
  const spatialContext = createI3SConversionSpatialContext({
    sourceCrs: 'EPSG:3857',
    coordinateFrame: 'projected',
    axisOrder: 'xyz',
    heightReference: 'ellipsoidal'
  });
  const resource = {
    id: 'native-projected',
    origin: [1000000, 2000000, 0] as const,
    mesh: {
      mode: 4,
      topology: 'triangle-list' as const,
      attributes: {
        POSITION: {
          size: 3,
          value: new Float64Array([
            1000000, 2000000, 10, 1000001, 2000000, 10, 1000000, 2000001, 10
          ])
        }
      }
    }
  };
  const codec = createMeshConversionCodec({spatialContext, maxPositionError: 0, draco: false});
  const output = (await (await codec.convert(resource, undefined))[Symbol.asyncIterator]().next())
    .value!;
  expect(output.spatialReference).toMatchObject({
    status: 'native',
    sourceCrs: 'EPSG:3857',
    targetCrs: undefined
  });
  expect(output.boundingBox).toEqual([
    [1000000, 2000000, 10],
    [1000001, 2000001, 10]
  ]);
  const outputs = [];
  for await (const encoded of encodePointCloudSource(createSource())) outputs.push(encoded);
  expect(outputs[0]).toMatchObject({
    coordinateSystem: 'lnglat-offsets',
    cartographicOrigin: [10, 20, 30],
    spatialReference: SOURCE_REFERENCE
  });
});

test('native projected I3S positions retain their CRS while normals use the output coordinate basis', async () => {
  const spatialContext = createI3SConversionSpatialContext({
    sourceCrs: 'EPSG:3857',
    coordinateFrame: 'projected',
    heightReference: 'ellipsoidal'
  });
  const output = await spatialContext.transformGeometryAsync([0, 0, 10], [1, 0, 0]);
  expect(Array.from(output.positions)).toEqual([0, 0, 10]);
  expect(output.normals![0]).toBeCloseTo(0, 5);
  expect(output.normals![2]).toBeCloseTo(1, 5);
  expect(spatialContext.spatialReference.status).toBe('native');
});

test.each([
  {positions: [0, 1], normals: undefined, frame: undefined},
  {positions: [NaN, 0, 0], normals: undefined, frame: undefined},
  {positions: [0, 0, 0], normals: [1, 0], frame: undefined},
  {positions: [0, 0, 0], normals: [Infinity, 0, 0], frame: undefined},
  {positions: [0, 0, 0], normals: [1, 0, 0], frame: 'unknown'}
])('native geometry validates packed inputs and normal declarations', async ({
  positions,
  normals,
  frame
}) => {
  await expect(
    createI3SConversionSpatialContext(SOURCE_REFERENCE).transformGeometryAsync(
      positions,
      normals,
      frame
    )
  ).rejects.toMatchObject({code: 'SPATIAL_INPUT_INVALID'});
});

test('already transformed ECEF source placement can be flattened without repeating reprojection', async () => {
  const tile = createTile();
  tile.content = {
    ...tile.content,
    coordinateSystem: 'cartesian',
    cartographicOrigin: [0, 0, 0],
    spatialReference: SPATIAL.spatialReference,
    modelMatrix: Array.from(new Matrix4().translate([6378137, 0, 0]))
  };
  const spatialContext = createI3SConversionSpatialContext({
    sourceCrs: 'EPSG:4978',
    coordinateFrame: 'geocentric',
    axisOrder: 'xyz',
    heightReference: 'ellipsoidal'
  });
  const output = await transformPointCloudSourceTile(tile, {spatialContext});
  expect(getPositions(output).slice(0, 3)).toEqual([6378137, 0, 10.000001]);
  expect(output.content!.spatialReference).toBe(spatialContext.spatialReference);
  expect(output.content!.modelMatrix).toBeUndefined();
});

test('unsupported Arrow transform metadata fails instead of treating quantized positions as raw coordinates', async () => {
  const tile = createTile();
  const attributes = {
    POSITION: {
      value: new Uint32Array([0, 0, 0]),
      size: 3,
      transform: {type: 'quantization' as const, origin: [0, 0, 1], bits: 32, range: 1}
    }
  };
  tile.content = {
    ...tile.content,
    data: makeMeshArrowTable(attributes, {schema: deduceMeshSchema(attributes)}),
    pointCount: 1
  };
  await expect(
    transformPointCloudSourceTile(tile, {spatialContext: SPATIAL})
  ).rejects.toMatchObject({code: 'POINT_CLOUD_POSITION_TRANSFORM_INVALID'});
});
