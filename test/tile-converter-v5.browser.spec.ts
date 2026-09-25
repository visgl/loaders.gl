import {expect, test} from 'vitest';
import {
  convertTileset,
  inspectTileset,
  TileConversionError,
  validateTileset,
  type TileConversionDiagnostic,
  type TileConversionSink,
  type TileConversionSource
} from '@loaders.gl/tile-converter/v5';

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
});
