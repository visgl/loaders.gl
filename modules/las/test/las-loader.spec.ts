// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {
  validateLoader,
  validateMeshCategoryData,
  validateTableCategoryData
} from 'test/common/conformance';

import {LASLoader, LASWorkerLoader} from '@loaders.gl/las';
import * as las from '@loaders.gl/las';
import * as bundledLas from '@loaders.gl/las/bundled';
import * as unbundledLas from '@loaders.gl/las/unbundled';
import {
  setLoaderOptions,
  fetchFile,
  parse,
  parseInBatches,
  load,
  makeIterator
} from '@loaders.gl/core';
import {
  PACKED_MESH_ARROW_LAYOUT_METADATA_KEY,
  type MeshArrowTable,
  type PackedMeshArrowLayout
} from '@loaders.gl/schema';
import {convertTableToMesh} from '@loaders.gl/schema-utils';
import * as arrow from 'apache-arrow';
// import {ArrowLoader} from '@loaders.gl/arrow';

const LAS_BINARY_URL = '@loaders.gl/las/test/data/indoor.laz';
const LAS_EXTRABYTES_BINARY_URL = '@loaders.gl/las/test/data/extrabytes.laz';
const LAS_1_4_BINARY_URL = '@loaders.gl/las/test/data/points-1.4.las';
const LAZ_1_4_BINARY_URL = '@loaders.gl/las/test/data/ellipsoid-1.4.laz';

setLoaderOptions({
  _workerType: 'test'
});

test('LASLoader#loader conformance', t => {
  validateLoader(t, LASLoader, 'LASLoader');
  validateLoader(t, LASWorkerLoader, 'LASWorkerLoader');
  t.end();
});

test('LASLoader#removed Arrow variant exports are absent', t => {
  t.notOk('LASArrowLoader' in las, 'root does not export LASArrowLoader');
  t.notOk('LASArrowLoader' in bundledLas, 'bundled does not export LASArrowLoader');
  t.notOk('LASArrowLoader' in unbundledLas, 'unbundled does not export LASArrowLoader');
  t.end();
});

test('LASLoader#parse(binary)', async t => {
  const data = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {skip: 10},
    core: {worker: false}
  });
  validateMeshCategoryData(t, data);

  t.is(data.header?.vertexCount, data.loaderData.totalRead, 'Original header was found');
  t.equal(data.mode, 0, 'mode is POINTS (0)');

  t.notOk(data.indices, 'INDICES attribute was not preset');
  t.equal(data.attributes.POSITION.value.length, 80805 * 3, 'POSITION attribute was found');

  t.end();
});

test('LASLoader#parseInBatches(mesh)', async t => {
  const response = await fetchFile(LAS_BINARY_URL);
  const batches = await parseInBatches(makeIterator(response), LASLoader, {
    batchSize: 25000,
    las: {skip: 10},
    core: {worker: false}
  });
  const batchVertexCounts: number[] = [];
  let totalVertexCount = 0;

  for await (const batch of batches as AsyncIterable<any>) {
    validateMeshCategoryData(t, batch);
    t.equal(batch.mode, 0, 'batch mode is POINTS (0)');
    t.ok(batch.attributes.POSITION, 'batch includes POSITION attribute');
    t.ok(batch.attributes.intensity, 'batch includes intensity attribute');
    t.ok(batch.attributes.classification, 'batch includes classification attribute');
    t.ok(batch.attributes.COLOR_0, 'batch includes COLOR_0 attribute');
    t.equal(
      batch.attributes.POSITION.value.length,
      batch.header.vertexCount * 3,
      'POSITION length matches batch vertex count'
    );
    t.ok(batch.progress > 0 && batch.progress <= 1, 'batch includes progress');
    batchVertexCounts.push(batch.header.vertexCount);
    totalVertexCount += batch.header.vertexCount;
  }

  t.deepEqual(batchVertexCounts, [25000, 25000, 25000, 5805], 'emits requested mesh batches');
  t.equal(totalVertexCount, 80805, 'batched vertex count matches full parse');
  t.end();
});

test('LASLoader#parseInBatches(arrow-table)', async t => {
  const response = await fetchFile(LAS_BINARY_URL);
  const batches = await parseInBatches(makeIterator(response), LASLoader, {
    batchSize: 30000,
    las: {shape: 'arrow-table', skip: 10},
    core: {worker: false}
  });
  const batchRowCounts: number[] = [];

  for await (const table of batches as AsyncIterable<any>) {
    validateTableCategoryData(t, table);
    t.equal(table.shape, 'arrow-table', 'batch has arrow-table shape');
    t.ok(table.data.getChild('POSITION'), 'batch includes POSITION column');
    t.ok(table.data.getChild('intensity'), 'batch includes intensity column');
    t.ok(table.data.getChild('classification'), 'batch includes classification column');
    batchRowCounts.push(table.data.numRows);
  }

  t.deepEqual(batchRowCounts, [30000, 30000, 20805], 'emits requested Arrow batches');
  t.end();
});

test('LASLoader#parseInBatches(fp64)', async t => {
  const response = await fetchFile(LAS_BINARY_URL);
  const batches = await parseInBatches(makeIterator(response), LASLoader, {
    batchSize: 25000,
    las: {skip: 10, fp64: true},
    core: {worker: false}
  });

  for await (const batch of batches as AsyncIterable<any>) {
    t.ok(
      batch.attributes.POSITION.value instanceof Float64Array,
      'batch POSITION attribute is Float64Array'
    );
    break;
  }

  t.end();
});

test('LASLoader#parseInBatches backend option', async t => {
  for (const backend of ['laz-perf', 'copc', 'laz-rs'] as const) {
    const response = await fetchFile(LAS_BINARY_URL);
    const batches = await parseInBatches(makeIterator(response), LASLoader, {
      batchSize: 30000,
      las: {backend, skip: 10},
      core: {worker: false}
    });
    let totalVertexCount = 0;

    for await (const batch of batches as AsyncIterable<any>) {
      totalVertexCount += batch.header.vertexCount;
    }

    t.equal(totalVertexCount, 80805, `${backend} backend emits all skipped points`);
  }

  t.end();
});

test('LASLoader#parse LAS 1.4 fixture', async t => {
  const data = await parse(fetchFile(LAS_1_4_BINARY_URL), LASLoader, {
    las: {backend: 'copc'},
    core: {worker: false}
  });
  validateMeshCategoryData(t, data);

  t.equal(data.loaderData.versionAsString, '1.4', 'fixture is LAS 1.4');
  t.equal(data.loaderData.pointsFormatId, 7, 'fixture uses point format 7');
  t.equal(data.header.vertexCount, 3, 'fixture point count is expected');
  t.ok(data.attributes.COLOR_0, 'fixture includes color');
  t.end();
});

test('LASLoader#parse LAZ 1.4 fixture', async t => {
  const data = await parse(fetchFile(LAZ_1_4_BINARY_URL), LASLoader, {
    las: {backend: 'copc', skip: 1000},
    core: {worker: false}
  });
  validateMeshCategoryData(t, data);

  t.equal(data.loaderData.versionAsString, '1.4', 'fixture is LAS 1.4');
  t.equal(data.loaderData.pointsFormatId, 7, 'fixture uses point format 7');
  t.equal(data.header.vertexCount, 100, 'fixture point count respects skip');
  t.ok(data.attributes.COLOR_0, 'fixture includes color');
  t.end();
});

test('LASLoader#parseSync rejects async backends', t => {
  const arrayBuffer = new ArrayBuffer(0);
  t.throws(
    () => bundledLas.LASLoader.parseSync?.(arrayBuffer, {las: {backend: 'copc'}}),
    /does not support parseSync/,
    'copc backend cannot run through parseSync'
  );
  t.throws(
    () => bundledLas.LASLoader.parseSync?.(arrayBuffer, {las: {backend: 'laz-rs'}}),
    /does not support parseSync/,
    'laz-rs backend cannot run through parseSync'
  );
  t.end();
});

test('LASLoader#options', async t => {
  const data = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {skip: 100, fp64: false},
    core: {worker: false}
  });
  t.ok(
    data.attributes.POSITION.value instanceof Float32Array,
    'POSITION attribute is Float32Array'
  );

  const data64 = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {skip: 100, fp64: true},
    core: {worker: false}
  });
  t.ok(
    data64.attributes.POSITION.value instanceof Float64Array,
    'POSITION attribute is Float64Array'
  );

  t.end();
});

test('LASWorker#parse(binary) extra bytes', async t => {
  const data = await parse(fetchFile(LAS_EXTRABYTES_BINARY_URL), LASLoader, {
    las: {skip: 10},
    core: {worker: false}
  });
  validateMeshCategoryData(t, data);

  t.is(data.header?.vertexCount, data.loaderData.totalRead, 'Original header was found');
  t.equal(data.mode, 0, 'mode is POINTS (0)');

  t.notOk(data.indices, 'INDICES attribute was not preset');
  t.equal(data.attributes.POSITION.value.length, 107 * 3, 'POSITION attribute was found');

  t.end();
});

test('LASWorkerLoader#load(worker)', async t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await load(LAS_BINARY_URL, LASWorkerLoader, {las: {skip: 10}});
  validateMeshCategoryData(t, data);

  t.equal(data.attributes.POSITION.value.length, 80805 * 3, 'POSITION attribute was found');
  t.end();
});

test('LASLoader#shape="mesh"', async t => {
  const result = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {las: {shape: 'mesh'}});
  validateMeshCategoryData(t, result);
  t.end();
});

// Related code was commented due to breaking pointcloud example on the website
test.skip('LASLoader#shape="columnar-table"', async t => {
  const result = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {shape: 'columnar-table'}
  });
  validateTableCategoryData(t, result);
  t.end();
});

test('LASLoader#shape="arrow-table"', async t => {
  const result = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {shape: 'arrow-table', skip: 10},
    core: {worker: false}
  });
  validateTableCategoryData(t, result);
  t.equal(result.shape, 'arrow-table', 'returns Arrow table shape');
  t.ok(result.data.getChild('POSITION'), 'returns POSITION column');
  t.end();
});

test('LASLoader#shape="arrow-table" interleaved packed output', async t => {
  const packedTable = (await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {shape: 'arrow-table', interleaved: true, skip: 10},
    core: {worker: false}
  })) as MeshArrowTable;
  const mesh = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {skip: 10},
    core: {worker: false}
  });
  const packedColumn = packedTable.data.getChild('vertexData')!;
  const packedLayout = packedTable.packedLayout as PackedMeshArrowLayout;
  const metadataLayout = JSON.parse(
    packedTable.data.schema.metadata.get(PACKED_MESH_ARROW_LAYOUT_METADATA_KEY)!
  ) as PackedMeshArrowLayout;

  validateTableCategoryData(t, packedTable);
  t.equal(packedTable.shape, 'arrow-table', 'returns Arrow table shape');
  t.deepEqual(
    packedTable.data.schema.fields.map(field => field.name),
    ['vertexData'],
    'packed output has one vertex-record column'
  );
  t.ok(packedColumn.type instanceof arrow.FixedSizeBinary, 'packed column is FixedSizeBinary');
  t.equal(packedColumn.type.byteWidth, 20, 'color LAS records use 20-byte packed stride');
  t.equal(
    packedTable.data.numRows,
    mesh.header.vertexCount,
    'row count matches parsed point count'
  );
  t.deepEqual(packedLayout, metadataLayout, 'wrapper packed layout mirrors Arrow metadata');
  t.deepEqual(
    packedLayout.attributes,
    [
      {attribute: 'POSITION', format: 'float32x3', byteOffset: 0},
      {attribute: 'COLOR_0', format: 'unorm8x4', byteOffset: 12},
      {attribute: 'intensity', format: 'uint16', byteOffset: 16},
      {attribute: 'classification', format: 'uint8', byteOffset: 18}
    ],
    'packed layout exposes expected LAS attribute views'
  );

  const packedBytes = packedColumn.data[0].buffers[arrow.BufferType.DATA] as Uint8Array;
  const packedView = new DataView(
    packedBytes.buffer,
    packedBytes.byteOffset,
    packedBytes.byteLength
  );
  t.equal(packedView.getFloat32(0, true), mesh.attributes.POSITION.value[0], 'packs position x');
  t.equal(packedView.getFloat32(4, true), mesh.attributes.POSITION.value[1], 'packs position y');
  t.equal(packedView.getFloat32(8, true), mesh.attributes.POSITION.value[2], 'packs position z');
  t.equal(packedBytes[12], mesh.attributes.COLOR_0.value[0], 'packs color red');
  t.equal(packedBytes[13], mesh.attributes.COLOR_0.value[1], 'packs color green');
  t.equal(packedBytes[14], mesh.attributes.COLOR_0.value[2], 'packs color blue');
  t.equal(packedBytes[15], mesh.attributes.COLOR_0.value[3], 'packs color alpha');
  t.equal(packedView.getUint16(16, true), mesh.attributes.intensity.value[0], 'packs intensity');
  t.equal(packedBytes[18], mesh.attributes.classification.value[0], 'packs classification');
  t.throws(
    () => convertTableToMesh(packedTable),
    /does not support packed-only Mesh Arrow tables/,
    'mesh reconstruction rejects packed-only LAS Arrow output'
  );
  t.end();
});

test('LASLoader#parseInBatches(arrow-table interleaved)', async t => {
  const response = await fetchFile(LAS_BINARY_URL);
  const batches = await parseInBatches(makeIterator(response), LASLoader, {
    batchSize: 30000,
    las: {shape: 'arrow-table', interleaved: true, skip: 10},
    core: {worker: false}
  });
  const batchRowCounts: number[] = [];

  for await (const table of batches as AsyncIterable<MeshArrowTable>) {
    const layout = table.packedLayout as PackedMeshArrowLayout;
    const column = table.data.getChild(layout.columnName)!;
    batchRowCounts.push(table.data.numRows);
    t.ok(column.type instanceof arrow.FixedSizeBinary, 'batch packed column is FixedSizeBinary');
    t.equal(column.type.byteWidth, layout.byteStride, 'batch column width matches packed stride');
  }

  t.deepEqual(batchRowCounts, [30000, 30000, 20805], 'emits requested packed Arrow batches');
  t.end();
});

test('LASLoader#interleaved option validation', async t => {
  await t.rejects(
    parse(fetchFile(LAS_BINARY_URL), LASLoader, {
      las: {interleaved: true},
      core: {worker: false}
    }),
    /requires las\.shape="arrow-table"/,
    'interleaved mode requires arrow-table shape'
  );
  await t.rejects(
    parse(fetchFile(LAS_BINARY_URL), LASLoader, {
      las: {shape: 'arrow-table', interleaved: true, fp64: true},
      core: {worker: false}
    }),
    /does not support las\.fp64=true/,
    'interleaved mode rejects fp64 positions'
  );
  await t.rejects(
    parse(fetchFile(LAS_BINARY_URL), LASLoader, {
      las: {shape: 'arrow-table', interleaved: true, backend: 'copc'},
      core: {worker: false}
    }),
    /only supported by backend "laz-perf", not "copc"/,
    'interleaved mode rejects the copc backend'
  );
  await t.rejects(
    parse(fetchFile(LAS_BINARY_URL), LASLoader, {
      las: {shape: 'arrow-table', interleaved: true, backend: 'laz-rs'},
      core: {worker: false}
    }),
    /only supported by backend "laz-perf", not "laz-rs"/,
    'interleaved mode rejects the laz-rs backend'
  );
  t.end();
});
