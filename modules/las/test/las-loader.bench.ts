// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {encodeSync, fetchFile, parse, parseInBatches} from '@loaders.gl/core';
import {LASLoader, LASWriter} from '@loaders.gl/las';
import type {LASLoaderOptions} from '@loaders.gl/las';
import type {Mesh} from '@loaders.gl/schema';

const LAZ_1_2_BINARY_URL = '@loaders.gl/las/test/data/indoor.laz';
const LAZ_1_4_BINARY_URL = '@loaders.gl/las/test/data/ellipsoid-1.4.laz';
const BATCH_SIZE = 25_000;
const STREAMING_LAZ_CHUNK_SIZE = 64 * 1024;
const LAZ_1_2_BACKENDS: NonNullable<NonNullable<LASLoaderOptions['las']>['backend']>[] = [
  'laz-perf',
  'copc',
  'laz-rs'
];
const LAZ_1_4_BACKENDS: NonNullable<NonNullable<LASLoaderOptions['las']>['backend']>[] = [
  'copc',
  'laz-rs',
  'typescript'
];
const STREAMING_LAZ_1_4_BACKENDS: NonNullable<NonNullable<LASLoaderOptions['las']>['backend']>[] = [
  'typescript'
];

/**
 * Adds LAS backend parse benchmarks.
 * @param bench Benchmark suite
 * @returns Benchmark suite with LAS cases added
 */
export default async function lasLoaderBench(bench) {
  const response = await fetchFile(LAZ_1_2_BINARY_URL);
  const lazArrayBuffer = await response.arrayBuffer();
  const laz14Response = await fetchFile(LAZ_1_4_BINARY_URL);
  const laz14ArrayBuffer = await laz14Response.arrayBuffer();
  const laz14Chunks = createBenchmarkArrayBufferChunks(laz14ArrayBuffer, STREAMING_LAZ_CHUNK_SIZE);
  const mesh = await createBenchmarkMesh(lazArrayBuffer);
  const laz14Mesh = await createBenchmarkLAZ14Mesh(laz14ArrayBuffer);
  const pointCount = mesh.header.vertexCount;
  const benchmarkOptions = {multiplier: pointCount, unit: 'output points', minIterations: 3};
  const laz14BenchmarkOptions = {
    multiplier: laz14Mesh.header.vertexCount,
    unit: 'output points',
    minIterations: 3
  };

  bench.groupSorted('LASLoader parse LAZ 1.2 (TypeScript LAZ unsupported)');

  for (const backend of LAZ_1_2_BACKENDS) {
    bench.addAsync(`parse LAZ 1.2 backend=${backend}`, benchmarkOptions, async () => {
      await parse(lazArrayBuffer, LASLoader, {
        core: {worker: false},
        las: {backend, shape: 'arrow-table'}
      });
    });
  }

  bench.groupSorted('LASLoader parse LAZ 1.4');

  for (const backend of LAZ_1_4_BACKENDS) {
    bench.addAsync(`parse LAZ 1.4 backend=${backend}`, laz14BenchmarkOptions, async () => {
      await parse(laz14ArrayBuffer, LASLoader, {
        core: {worker: false},
        las: {backend, shape: 'arrow-table'}
      });
    });
  }

  bench.groupSorted('LASLoader parseInBatches streaming LAZ 1.4');

  for (const backend of STREAMING_LAZ_1_4_BACKENDS) {
    bench.addAsync(
      `parseInBatches streaming LAZ 1.4 backend=${backend}`,
      laz14BenchmarkOptions,
      async () => {
        const batches = await parseInBatches(laz14Chunks, LASLoader, {
          batchSize: BATCH_SIZE,
          core: {worker: false},
          las: {backend, shape: 'arrow-table'}
        });
        for await (const _batch of batches) {
          _batch;
        }
      }
    );
  }

  bench.groupSorted('LASWriter');

  bench.add('LASWriter LAS 1.2 backend=typescript', benchmarkOptions, () => {
    encodeBenchmarkLASArrayBuffer(mesh, '1.2');
  });
  bench.add('LASWriter LAS 1.4 backend=typescript', benchmarkOptions, () => {
    encodeBenchmarkLASArrayBuffer(mesh, '1.4');
  });

  return bench;
}

/**
 * Creates one mesh source used by all LAS benchmarks.
 * @param lazArrayBuffer Source LAZ fixture bytes
 * @returns Decoded benchmark mesh
 */
async function createBenchmarkMesh(lazArrayBuffer: ArrayBuffer): Promise<Mesh> {
  return (await parse(lazArrayBuffer, LASLoader, {
    core: {worker: false},
    las: {backend: 'laz-rs'}
  })) as Mesh;
}

/**
 * Creates one LAZ 1.4 mesh source used to size streaming LAZ benchmarks.
 * @param lazArrayBuffer Source LAZ 1.4 fixture bytes
 * @returns Decoded benchmark mesh
 */
async function createBenchmarkLAZ14Mesh(lazArrayBuffer: ArrayBuffer): Promise<Mesh> {
  return (await parse(lazArrayBuffer, LASLoader, {
    core: {worker: false},
    las: {backend: 'laz-rs'}
  })) as Mesh;
}

/**
 * Copies one ArrayBuffer into fixed-size chunks outside the benchmark loop.
 * @param arrayBuffer Source bytes
 * @param chunkByteLength Maximum chunk byte length
 * @returns ArrayBuffer chunks
 */
function createBenchmarkArrayBufferChunks(
  arrayBuffer: ArrayBuffer,
  chunkByteLength: number
): ArrayBuffer[] {
  const bytes = new Uint8Array(arrayBuffer);
  const chunks: ArrayBuffer[] = [];
  for (let offset = 0; offset < bytes.byteLength; offset += chunkByteLength) {
    chunks.push(bytes.slice(offset, Math.min(offset + chunkByteLength, bytes.byteLength)).buffer);
  }
  return chunks;
}

/**
 * Encodes the shared benchmark mesh as uncompressed LAS.
 * @param mesh Benchmark mesh
 * @param version LAS output version
 * @returns LAS bytes
 */
function encodeBenchmarkLASArrayBuffer(mesh: Mesh, version: '1.2' | '1.4'): ArrayBuffer {
  return encodeSync(mesh, LASWriter, {
    las: {
      version,
      pointDataRecordFormat:
        version === '1.4' ? (mesh.attributes.COLOR_0 ? 7 : 6) : mesh.attributes.COLOR_0 ? 2 : 0
    }
  });
}
