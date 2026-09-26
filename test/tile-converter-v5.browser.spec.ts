import {expect, test} from 'vitest';
import {
  createI3SConversionSpatialContext,
  createTiles3DConversionSpatialContext,
  convertTileset,
  inspectTileset,
  TileConversionError,
  validateTileset,
  type TileConversionDiagnostic,
  type TileConversionSink,
  type TileConversionSource
} from '@loaders.gl/tile-converter/v5';
import {get3DTilesSpatialReference, getI3SSpatialReference} from '@loaders.gl/tiles';

test('tile-converter(v5)#inspectTileset delegates to the injected source', async () => {
  const source: TileConversionSource<{format: string}, Uint8Array> = {
    inspect: async () => ({format: 'fixture'}),
    read: async function* () {}
  };

  await expect(inspectTileset(source)).resolves.toEqual({format: 'fixture'});
});

test('tile-converter(v5)#convertTileset awaits writes and reports resource and byte counts', async () => {
  const inspection = {sourceProfile: 'fixture-1', targetProfile: 'fixture-2'};
  const source: TileConversionSource<typeof inspection, Uint8Array> = {
    inspect: async () => inspection,
    read: async function* () {
      yield new Uint8Array([1, 2]);
      yield new Uint8Array([3]);
    }
  };
  const writtenResources: Uint8Array[] = [];
  const progressPhases: string[] = [];
  let concurrentWrites = 0;
  let largestConcurrentWrites = 0;
  const sink: TileConversionSink<Uint8Array> = {
    write: async resource => {
      concurrentWrites++;
      largestConcurrentWrites = Math.max(largestConcurrentWrites, concurrentWrites);
      await Promise.resolve();
      writtenResources.push(resource);
      concurrentWrites--;
    },
    finalize: async () => {},
    abort: async reason => {
      throw reason;
    }
  };
  const report = await convertTileset({
    source,
    sink,
    codec: {
      convert: async function* (resource) {
        yield new Uint8Array(resource.map(value => value + 1));
      }
    },
    measureInputBytes: resource => resource.byteLength,
    measureOutputBytes: resource => resource.byteLength,
    onProgress: progress => progressPhases.push(progress.phase)
  });

  expect(writtenResources).toEqual([new Uint8Array([2, 3]), new Uint8Array([4])]);
  expect(largestConcurrentWrites).toBe(1);
  expect(report).toMatchObject({
    state: 'completed',
    inputResources: 2,
    outputResources: 2,
    inputBytes: 3,
    outputBytes: 3,
    largestOutputResourceBytes: 2,
    diagnostics: []
  });
  expect(progressPhases).toContain('finalize');
});

test('tile-converter(v5)#convertTileset aborts the destination when output exceeds the byte limit', async () => {
  const source: TileConversionSource<null, Uint8Array> = {
    inspect: async () => null,
    read: async function* () {
      yield new Uint8Array([1]);
    }
  };
  let abortReason: unknown;
  const sink: TileConversionSink<Uint8Array> = {
    write: async () => {},
    finalize: async () => {},
    abort: async reason => {
      abortReason = reason;
    }
  };

  await expect(
    convertTileset({
      source,
      sink,
      codec: {
        convert: async function* () {
          yield new Uint8Array([1, 2]);
        }
      },
      measureInputBytes: resource => resource.byteLength,
      measureOutputBytes: resource => resource.byteLength,
      maxOutputResourceBytes: 1
    })
  ).rejects.toThrow('exceeding the configured limit');
  expect(abortReason).toBeInstanceOf(TileConversionError);
  expect(abortReason).toMatchObject({code: 'OUTPUT_RESOURCE_TOO_LARGE'});
});

test('tile-converter(v5)#validateTileset returns validation diagnostics', async () => {
  const diagnostics: TileConversionDiagnostic[] = [
    {code: 'unknown-crs', message: 'CRS needs review', severity: 'error'}
  ];
  await expect(validateTileset({tileset: {}, validate: async () => diagnostics})).resolves.toEqual({
    valid: false,
    diagnostics
  });
});

test('tile-converter(v5)#convertTileset releases source iteration after cancellation', async () => {
  const controller = new AbortController();
  let sourceClosed = false;
  let sinkAborted = false;
  let conversionCount = 0;
  const source: TileConversionSource<null, Uint8Array> = {
    inspect: async () => null,
    read: async function* () {
      try {
        yield new Uint8Array([1]);
        yield new Uint8Array([2]);
      } finally {
        sourceClosed = true;
      }
    }
  };
  const sink: TileConversionSink<Uint8Array> = {
    write: async () => {
      controller.abort(new Error('cancelled by test'));
    },
    finalize: async () => {},
    abort: async () => {
      sinkAborted = true;
    }
  };

  await expect(
    convertTileset({
      source,
      sink,
      codec: {
        convert: async function* (resource) {
          conversionCount++;
          yield resource;
        }
      },
      measureInputBytes: resource => resource.byteLength,
      measureOutputBytes: resource => resource.byteLength,
      signal: controller.signal
    })
  ).rejects.toThrow('cancelled by test');
  expect(sourceClosed).toBe(true);
  expect(sinkAborted).toBe(true);
  expect(conversionCount).toBe(1);
});

test('tile-converter(v5)#3D Tiles spatial context transforms ECEF positions and bounds', () => {
  const spatial = createTiles3DConversionSpatialContext(
    get3DTilesSpatialReference({root: {boundingVolume: {region: [0, 0, 0.01, 0.01, 0, 100]}}}),
    {targetCrs: 'EPSG:3857'}
  );

  const positions = spatial.transformPositions(new Float64Array([6378137.25, 0, 0]));
  const bounds = spatial.transformBoundingVolume({
    region: [0, 0, 0.01, 0.01, 0, 100]
  });

  expect(positions).toBeInstanceOf(Float64Array);
  expect(positions[0]).toBeCloseTo(0, 4);
  expect(positions[2]).toBeCloseTo(0.25, 3);
  expect(spatial.spatialReference.status).toBe('transformed');
  expect(bounds.box).toHaveLength(12);
  expect(bounds.box?.every(Number.isFinite)).toBe(true);
});

test('tile-converter(v5)#I3S spatial context normalizes vertical units and keeps stable origins', () => {
  const spatial = createI3SConversionSpatialContext(
    getI3SSpatialReference({
      spatialReference: {wkid: 4326},
      heightModelInfo: {heightModel: 'ellipsoidal', heightUnit: 'foot'}
    }),
    {targetCrs: 'EPSG:3857'}
  );

  const transformed = spatial.transformPositions(new Float64Array([0, 0, 100]), [0, 0, 0]);

  expect(transformed.sourcePositions).toEqual(new Float64Array([0, 0, 30.48]));
  expect(transformed.positions[2]).toBeCloseTo(30.48, 4);
  expect(transformed.origin[2]).toBe(0);
  expect(spatial.spatialReference.status).toBe('transformed');
});

test('tile-converter(v5)#spatial context rejects unknown CRS requests with diagnostics', () => {
  try {
    createTiles3DConversionSpatialContext({}, {targetCrs: 'EPSG:4326'});
    throw new Error('Expected the spatial request to be rejected');
  } catch (error) {
    expect(error).toBeInstanceOf(TileConversionError);
    expect(error).toMatchObject({
      code: 'SPATIAL_REFERENCE_UNRESOLVED',
      diagnostics: expect.arrayContaining([
        expect.objectContaining({code: 'SPATIAL_REFERENCE_UNRESOLVED', severity: 'error'})
      ])
    });
  }
});

test('tile-converter(v5)#I3S spatial context applies an explicit async terrain provider', async () => {
  const spatial = createI3SConversionSpatialContext(
    getI3SSpatialReference({
      spatialReference: {wkid: 4326},
      heightModelInfo: {heightModel: 'ellipsoidal', heightUnit: 'meter'},
      elevationInfo: {mode: 'relativeToGround'}
    }),
    {
      targetCrs: 'EPSG:3857',
      terrainElevationProvider: {
        heightReference: 'ellipsoidal',
        sampleElevations: async positions => positions.map(() => 100),
        getElevationRange: async () => ({minimum: 100, maximum: 100})
      }
    }
  );

  const transformed = await spatial.transformPositionsAsync([0, 0, 5], [0, 0, 0]);

  expect(transformed.positions).toEqual(new Float32Array([0, 0, 5]));
  expect(transformed.sourcePositions).toEqual(new Float64Array([0, 0, 105]));
});
