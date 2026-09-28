import {expect, test} from 'vitest';
import {createBoundedMemoryTileConversionSink} from '@loaders.gl/tile-converter/v5/browser';
import {
  createI3SConversionSpatialContext,
  createTiles3DConversionSpatialContext,
  createManifestBackedTileConversionSink,
  convertFeatureAttributesToArrowBatches,
  convertTileset,
  inspectTileset,
  TileConversionError,
  validateTileset,
  type TileConversionDiagnostic,
  type TileResourceManifest,
  type TileConversionSink,
  type TileConversionSource
} from '@loaders.gl/tile-converter/v5';
import {
  createTilesetSpatialReference,
  get3DTilesSpatialReference,
  getI3SSpatialReference
} from '@loaders.gl/tiles';
import type {Schema} from '@loaders.gl/schema';

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

test('tile-converter(v5)#manifest-backed sinks resume matching resources and finalize manifests', async () => {
  interface Resource {
    readonly id: string;
    readonly bytes: Uint8Array;
  }

  let manifest: TileResourceManifest | null = null;
  const manifestStore = {
    load: async () => manifest,
    save: async (nextManifest: TileResourceManifest) => {
      manifest = nextManifest;
    }
  };
  const writtenResources: Resource[] = [];
  let finalized = false;
  const createSink = (): TileConversionSink<Resource> => ({
    write: async resource => {
      writtenResources.push(resource);
    },
    finalize: async () => {
      finalized = true;
    },
    abort: async () => {}
  });
  const createResumableSink = () =>
    createManifestBackedTileConversionSink({
      sink: createSink(),
      manifestStore,
      getResourceId: resource => resource.id,
      measureResourceBytes: resource => resource.bytes.byteLength,
      fingerprintResource: resource => Array.from(resource.bytes).join(',')
    });
  const firstResource = {id: 'root/mesh.glb', bytes: new Uint8Array([1, 2])};
  const secondResource = {id: 'child/mesh.glb', bytes: new Uint8Array([3])};
  const report = {
    state: 'completed' as const,
    inputResources: 2,
    outputResources: 2,
    inputBytes: 3,
    outputBytes: 3,
    largestOutputResourceBytes: 2,
    diagnostics: []
  };

  const interruptedSink = await createResumableSink();
  await interruptedSink.write(firstResource);
  expect(manifest?.complete).toBe(false);

  const resumedSink = await createResumableSink();
  await resumedSink.write(firstResource);
  await resumedSink.write(secondResource);
  await resumedSink.finalize(report);

  expect(writtenResources).toEqual([firstResource, secondResource]);
  expect(finalized).toBe(true);
  expect(manifest).toMatchObject({
    version: 1,
    complete: true,
    resources: [
      {resourceId: 'child/mesh.glb', byteLength: 1, fingerprint: '3'},
      {resourceId: 'root/mesh.glb', byteLength: 2, fingerprint: '1,2'}
    ],
    report
  });
});

test('tile-converter(v5)#manifest-backed sinks reject changed content on resume', async () => {
  interface Resource {
    readonly id: string;
    readonly bytes: Uint8Array;
  }

  let manifest: TileResourceManifest | null = null;
  const manifestStore = {
    load: async () => manifest,
    save: async (nextManifest: TileResourceManifest) => {
      manifest = nextManifest;
    }
  };
  const writtenResources: Resource[] = [];
  const createResumableSink = () =>
    createManifestBackedTileConversionSink({
      sink: {
        write: async resource => {
          writtenResources.push(resource);
        },
        finalize: async () => {},
        abort: async () => {}
      },
      manifestStore,
      getResourceId: resource => resource.id,
      measureResourceBytes: resource => resource.bytes.byteLength,
      fingerprintResource: resource => Array.from(resource.bytes).join(',')
    });

  const originalResource = {id: 'root/mesh.glb', bytes: new Uint8Array([1])};
  const firstSink = await createResumableSink();
  await firstSink.write(originalResource);

  const resumedSink = await createResumableSink();
  await expect(
    resumedSink.write({id: 'root/mesh.glb', bytes: new Uint8Array([2])})
  ).rejects.toMatchObject({code: 'RESOURCE_RESUME_MISMATCH'});
  expect(writtenResources).toEqual([originalResource]);
});

test('tile-converter(v5)#manifest-backed sinks stop queued writes after a destination failure', async () => {
  interface Resource {
    readonly id: string;
    readonly bytes: Uint8Array;
  }

  const attemptedIds: string[] = [];
  const sink = await createManifestBackedTileConversionSink({
    sink: {
      write: async (resource: Resource) => {
        attemptedIds.push(resource.id);
        throw new Error('destination write failed');
      },
      finalize: async () => {},
      abort: async () => {}
    },
    manifestStore: {
      load: async () => null,
      save: async () => {}
    },
    getResourceId: resource => resource.id,
    measureResourceBytes: resource => resource.bytes.byteLength,
    fingerprintResource: resource => Array.from(resource.bytes).join(',')
  });

  const firstWrite = sink.write({id: 'first.bin', bytes: new Uint8Array([1])});
  const secondWrite = sink.write({id: 'second.bin', bytes: new Uint8Array([2])});
  await expect(firstWrite).rejects.toThrow('destination write failed');
  await expect(secondWrite).rejects.toThrow('destination write failed');
  expect(attemptedIds).toEqual(['first.bin']);
});

test('tile-converter(v5)#manifest-backed sink clears checkpoints before destination cleanup', async () => {
  interface Resource {
    readonly id: string;
    readonly bytes: Uint8Array;
  }

  let manifest: TileResourceManifest | null = null;
  const eventOrder: string[] = [];
  const sink = await createManifestBackedTileConversionSink({
    sink: {
      write: async () => {},
      finalize: async () => {},
      abort: async () => {
        eventOrder.push('destination-abort');
      }
    },
    manifestStore: {
      load: async () => manifest,
      save: async nextManifest => {
        manifest = nextManifest;
        if (nextManifest.resources.length === 0) eventOrder.push('checkpoint-cleared');
      }
    },
    getResourceId: resource => resource.id,
    measureResourceBytes: resource => resource.bytes.byteLength,
    fingerprintResource: resource => Array.from(resource.bytes).join(',')
  });

  await sink.write({id: 'tile/mesh.glb', bytes: new Uint8Array([1])});
  await sink.abort(new Error('conversion failed'));

  expect(manifest).toMatchObject({complete: false, resources: []});
  expect(eventOrder).toEqual(['checkpoint-cleared', 'destination-abort']);
});

test('tile-converter(v5)#browser memory sink returns named Blobs within its byte budget', async () => {
  const sink = createBoundedMemoryTileConversionSink({maxTotalBytes: 3});
  await sink.write({
    resourceId: 'tiles/b.glb',
    parts: [new Uint8Array([2])],
    contentType: 'model/gltf-binary'
  });
  await sink.write({resourceId: 'tiles/a.glb', parts: [new Uint8Array([1, 2])]});
  await sink.finalize({
    state: 'completed',
    inputResources: 0,
    outputResources: 2,
    inputBytes: 0,
    outputBytes: 3,
    largestOutputResourceBytes: 2,
    diagnostics: []
  });

  const files = sink.getFiles();
  expect(files.map(file => file.resourceId)).toEqual(['tiles/a.glb', 'tiles/b.glb']);
  await expect(files[0].blob.arrayBuffer()).resolves.toEqual(new Uint8Array([1, 2]).buffer);
  expect(files[1].blob.type).toBe('model/gltf-binary');
});

test('tile-converter(v5)#browser memory sink rejects output beyond its byte budget and clears on abort', async () => {
  const sink = createBoundedMemoryTileConversionSink({maxTotalBytes: 1});
  await sink.write({resourceId: 'tiles/a.glb', parts: [new Uint8Array([1])]});

  await expect(
    sink.write({resourceId: 'tiles/b.glb', parts: [new Uint8Array([2])]})
  ).rejects.toMatchObject({code: 'OUTPUT_MEMORY_LIMIT_EXCEEDED'});
  await sink.abort(new Error('cancelled'));

  expect(sink.getFiles()).toEqual([]);
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

test('tile-converter(v5)#spatial contexts retain targets from normalized references', () => {
  const discovered = createTilesetSpatialReference(
    {sourceCrs: 'EPSG:4326', heightReference: 'ellipsoidal', provenance: 'metadata'},
    {targetCrs: 'EPSG:3857'}
  );
  const spatial = createTiles3DConversionSpatialContext(discovered);

  expect(spatial.spatialReference.targetCrs).toBe('EPSG:3857');
  expect(spatial.transformPositions([1, 1, 0])[0]).toBeCloseTo(111319.49, 1);
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

test('tile-converter(v5)#spatial transformer initialization failures use typed diagnostics', () => {
  const discovered = {
    sourceCrs: 'EPSG:4326',
    heightReference: 'orthometric' as const,
    provenance: 'metadata' as const
  };
  const options = {
    targetHeightReference: 'ellipsoidal' as const,
    geoidModel: 'missing-test-geoid'
  };

  for (const createContext of [
    () => createTiles3DConversionSpatialContext(discovered, options),
    () => createI3SConversionSpatialContext(discovered, options)
  ]) {
    try {
      createContext();
      throw new Error('Expected spatial transformer initialization to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(TileConversionError);
      expect(error).toMatchObject({
        code: 'SPATIAL_REFERENCE_UNRESOLVED',
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            code: 'SPATIAL_REFERENCE_UNRESOLVED',
            severity: 'error',
            message: expect.stringContaining('geoid model')
          })
        ])
      });
    }
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

test('tile-converter(v5)#feature attributes preserve exact IDs, nulls, lists, and raw metadata', () => {
  const schema: Schema = {
    fields: [
      {name: 'feature_id', type: 'int64', nullable: false},
      {name: 'name', type: 'utf8', nullable: true},
      {
        name: 'class_codes',
        type: {type: 'list', children: [{name: 'item', type: 'uint16', nullable: false}]},
        nullable: true
      },
      {name: 'raw_metadata', type: 'binary', nullable: true}
    ],
    metadata: {source: 'i3s'}
  };
  const batches = convertFeatureAttributesToArrowBatches(
    [
      {
        featureId: 9007199254740993n,
        metadataClass: 'Buildings',
        properties: {name: 'Café', class_codes: [2, 7]},
        rawMetadata: new Uint8Array([10, 11])
      },
      {
        featureId: 9007199254740994n,
        metadataClass: 'Buildings',
        properties: {name: null, class_codes: null}
      },
      {
        featureId: 9007199254740995n,
        metadataClass: 'Buildings',
        properties: {name: '雪', class_codes: [9]}
      }
    ],
    {schema, rawMetadataField: 'raw_metadata', batchSize: 2}
  );

  expect(batches.map(batch => batch.length)).toEqual([2, 1]);
  expect(batches[0].schema.metadata?.['loaders.gl:feature-class']).toBe('Buildings');
  expect(batches[0].data.getChild('feature_id')?.get(0)).toBe(9007199254740993n);
  expect(batches[0].data.getChild('name')?.get(0)).toBe('Café');
  expect(batches[0].data.getChild('name')?.get(1)).toBeNull();
  expect(batches[0].data.getChild('class_codes')?.get(0)?.toArray()).toEqual(
    new Uint16Array([2, 7])
  );
  expect(batches[0].data.getChild('raw_metadata')?.get(0)).toEqual(new Uint8Array([10, 11]));
  expect(batches[1].data.getChild('feature_id')?.get(0)).toBe(9007199254740995n);
  expect(batches[1].data.getChild('name')?.get(0)).toBe('雪');
});

test('tile-converter(v5)#feature attributes reject unmapped values and unsafe numeric IDs', () => {
  const schema: Schema = {
    fields: [{name: 'feature_id', type: 'int64', nullable: false}],
    metadata: {}
  };
  const baseFeature = {metadataClass: 'Parcels', properties: {unmapped: 'value'}};

  expect(() =>
    convertFeatureAttributesToArrowBatches([{...baseFeature, featureId: 1}], {schema})
  ).toThrow('not declared in the Arrow schema');
  expect(() =>
    convertFeatureAttributesToArrowBatches(
      [{metadataClass: 'Parcels', featureId: Number.MAX_SAFE_INTEGER + 1, properties: {}}],
      {schema}
    )
  ).toThrow(TileConversionError);

  expect(() =>
    convertFeatureAttributesToArrowBatches(
      [{metadataClass: 'Parcels', featureId: 1, properties: {count: 256}}],
      {
        schema: {
          fields: [
            {name: 'feature_id', type: 'int64', nullable: false},
            {name: 'count', type: 'uint8', nullable: false}
          ],
          metadata: {}
        }
      }
    )
  ).toThrow('outside the range');
});

test('tile-converter(v5)#feature attributes validate nullability, integer schemas, and decimals', () => {
  const feature = {featureId: 1, metadataClass: 'Parcels', properties: {}};

  expect(() =>
    convertFeatureAttributesToArrowBatches([feature], {
      schema: {
        fields: [
          {name: 'feature_id', type: 'int64', nullable: false},
          {name: 'optional', type: 'utf8'}
        ],
        metadata: {}
      }
    })
  ).toThrow('has no value');

  expect(() =>
    convertFeatureAttributesToArrowBatches([feature], {
      schema: {fields: [{name: 'feature_id', type: 'int'}], metadata: {}}
    })
  ).toThrow('explicit integer width and signedness');

  expect(() =>
    convertFeatureAttributesToArrowBatches([{...feature, properties: {amount: 1.25}}], {
      schema: {
        fields: [
          {name: 'feature_id', type: 'int64', nullable: false},
          {
            name: 'amount',
            type: {type: 'decimal', bitWidth: 128, precision: 8, scale: 2},
            nullable: true
          }
        ],
        metadata: {}
      }
    })
  ).toThrow('unscaled bigint decimal value');
});
