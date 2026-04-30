/* eslint-disable max-len */
import test from 'tape-promise/tape';
import * as arrow from 'apache-arrow';
import {validateLoader, validateMeshCategoryData} from 'test/common/conformance';
import {validateArrowTableSchema} from '@loaders.gl/arrow';
import {indexedMeshArrowSchema} from '@loaders.gl/schema';

import {PLYLoader, PLYWorkerLoader} from '@loaders.gl/ply';
import {parsePLYToElementTables} from '../src/lib/parse-ply-arrow';
import {
  setLoaderOptions,
  fetchFile,
  load,
  parse,
  parseSync,
  parseInBatches,
  makeIterator
} from '@loaders.gl/core';

const PLY_CUBE_ATT_URL = '@loaders.gl/ply/test/data/cube_att.ply';
const PLY_BUN_ZIPPER_URL = '@loaders.gl/ply/test/data/bun_zipper.ply';
const PLY_BUN_BINARY_URL = '@loaders.gl/ply/test/data/bunny.ply';
const GAUSSIAN_SPLAT_BINARY_URL = '@loaders.gl/ply/test/data/gaussian/train-1000.ply';

const GAUSSIAN_SPLAT_PLY = `ply
format ascii 1.0
element vertex 2
property float x
property float y
property float z
property float f_dc_0
property float f_dc_1
property float f_dc_2
property float opacity
property float scale_0
property float scale_1
property float scale_2
property float rot_0
property float rot_1
property float rot_2
property float rot_3
end_header
0 0 0 0 0 0 1 0.1 0.2 0.3 1 0 0 0
1 2 3 1 0 -1 0.5 0.4 0.5 0.6 0.707 0 0.707 0
`;

const ASCII_POINT_CLOUD_PLY = `ply
format ascii 1.0
element vertex 3
property float x
property float y
property float z
property float intensity
end_header
0 0 0 0.25
1 2 3 0.5
4 5 6 0.75
`;

setLoaderOptions({
  _workerType: 'test'
});

function validateTextPLY(t, data) {
  t.equal(data.indices.value.length, 36, 'Indices found');
  t.equal(data.attributes.POSITION.value.length, 72, 'POSITION attribute was found');
  t.equal(data.attributes.NORMAL.value.length, 72, 'NORMAL attribute was found');
}

test('PLYLoader#loader conformance', t => {
  validateLoader(t, PLYLoader, 'PLYLoader');
  validateLoader(t, PLYWorkerLoader, 'PLYWorkerLoader');
  t.end();
});

test('PLYLoader#parse(textFile)', async t => {
  const data = await parse(fetchFile(PLY_CUBE_ATT_URL), PLYLoader, {});

  validateMeshCategoryData(t, data);
  validateTextPLY(t, data);
  t.end();
});

test('PLYLoader#parse(shape: arrow-table)', async t => {
  const table = await parse(fetchFile(PLY_CUBE_ATT_URL), PLYLoader, {
    ply: {shape: 'arrow-table'}
  });

  t.equal(table.shape, 'arrow-table', 'table has arrow-table shape');
  validateArrowTableSchema(table.data, indexedMeshArrowSchema, {
    schemaName: 'PLYLoader IndexedMesh table'
  });
  t.deepEqual(
    table.data.schema.fields.map(field => field.name),
    ['POSITION', 'indices', 'NORMAL'],
    'indexed schema fields are first'
  );

  const indicesColumn = table.data.getChild('indices');
  t.ok(indicesColumn, 'indices column was found');
  t.equal(indicesColumn.get(0).length, 36, 'indices were found in row 0');
  t.equal(indicesColumn.get(1), null, 'indices are null after row 0');

  t.end();
});

test('PLYLoader#parse(raw element tables preserve list properties)', async t => {
  const response = await fetchFile(PLY_CUBE_ATT_URL);
  const elementTables = parsePLYToElementTables(await response.text());
  const faceTable = elementTables.elements.find(
    elementTable => elementTable.element.name === 'face'
  );

  t.ok(faceTable, 'face element table was found');
  t.ok(
    faceTable.table.getChild('vertex_indices')?.type instanceof arrow.List,
    'face indices are an Arrow list'
  );
  t.ok(
    faceTable.table.getChild('texcoord')?.type instanceof arrow.List,
    'face texcoords are an Arrow list'
  );
  t.deepEqual(
    Array.from(faceTable.table.getChild('vertex_indices').get(0)),
    [9, 11, 13],
    'face vertex indices are preserved before mesh conversion'
  );
  t.equal(faceTable.table.getChild('texcoord').get(0).length, 6, 'face texcoord list is preserved');
  t.end();
});

test('PLYLoader#parse(binary)', async t => {
  const data = await parse(fetchFile(PLY_BUN_BINARY_URL), PLYLoader);

  validateMeshCategoryData(t, data);
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');
  t.end();
});

test('PLYLoader#parse(ascii)', async t => {
  const data = await parse(fetchFile(PLY_BUN_ZIPPER_URL), PLYLoader, {
    core: {worker: false}
  });

  validateMeshCategoryData(t, data);
  t.equal(data.attributes.POSITION.value.length, 107841, 'POSITION attribute was found');
  t.equal(data.attributes.confidence.value.length, 35947, 'confidence attribute was found');
  t.equal(data.attributes.intensity.value.length, 35947, 'intensity attribute was found');
  t.end();
});

test('PLYLoader#parse(gaussian splat metadata)', async t => {
  const table = parseSync(GAUSSIAN_SPLAT_PLY, PLYLoader, {
    ply: {shape: 'arrow-table'}
  });

  t.equal(table.shape, 'arrow-table', 'table has arrow-table shape');
  t.equal(table.data.numRows, 2, 'table has one row per splat');
  t.equal(
    table.data.schema.metadata.get('loaders_gl.semantic_type'),
    'gaussian-splats',
    'schema identifies Gaussian splat data'
  );

  const scaleField = table.data.schema.fields.find(field => field.name === 'scale_0');
  t.equal(
    scaleField?.metadata.get('loaders_gl.gaussian_splats.semantic'),
    'scale',
    'scale field has semantic metadata'
  );
  t.equal(
    scaleField?.metadata.get('loaders_gl.gaussian_splats.encoding'),
    'log',
    'scale field has encoding metadata'
  );

  const opacityField = table.data.schema.fields.find(field => field.name === 'opacity');
  t.equal(
    opacityField?.metadata.get('loaders_gl.gaussian_splats.encoding'),
    'logit',
    'opacity field has encoding metadata'
  );

  t.ok(table.data.getChild('f_dc_0'), 'f_dc_0 column was preserved');
  t.ok(table.data.getChild('scale_0'), 'scale_0 column was preserved');
  t.ok(table.data.getChild('rot_0'), 'rot_0 column was preserved');
  t.end();
});

test('PLYLoader#parse(gaussian splat binary fixture)', async t => {
  const table = await parse(fetchFile(GAUSSIAN_SPLAT_BINARY_URL), PLYLoader, {
    ply: {shape: 'arrow-table'}
  });

  t.equal(table.shape, 'arrow-table', 'table has arrow-table shape');
  t.equal(table.data.numRows, 1000, 'table has one row per fixture splat');
  t.equal(table.data.schema.fields.length, 58, 'schema has expected normalized PLY columns');
  t.equal(
    table.data.schema.metadata.get('loaders_gl.semantic_type'),
    'gaussian-splats',
    'schema identifies Gaussian splat data'
  );

  const plyElements = JSON.parse(table.data.schema.metadata.get('ply_elements'));
  t.equal(plyElements[0].name, 'vertex', 'schema preserves PLY vertex element metadata');
  t.equal(plyElements[0].count, 1000, 'schema preserves truncated vertex count');
  t.equal(plyElements[0].properties.length, 62, 'schema preserves source PLY property count');

  const positionField = table.data.schema.fields.find(field => field.name === 'POSITION');
  t.ok(positionField?.type instanceof arrow.FixedSizeList, 'POSITION is a fixed size list');
  t.equal(positionField?.type.listSize, 3, 'POSITION is a vec3');
  t.ok(table.data.getChild('POSITION'), 'POSITION column was preserved');

  const normalField = table.data.schema.fields.find(field => field.name === 'NORMAL');
  t.ok(normalField?.type instanceof arrow.FixedSizeList, 'NORMAL is a fixed size list');
  t.equal(normalField?.type.listSize, 3, 'NORMAL is a vec3');

  const scaleField = table.data.schema.fields.find(field => field.name === 'scale_0');
  t.equal(
    scaleField?.metadata.get('loaders_gl.gaussian_splats.semantic'),
    'scale',
    'scale field has semantic metadata'
  );
  t.equal(
    scaleField?.metadata.get('loaders_gl.gaussian_splats.encoding'),
    'log',
    'scale field has encoding metadata'
  );

  const opacityField = table.data.schema.fields.find(field => field.name === 'opacity');
  t.equal(
    opacityField?.metadata.get('loaders_gl.gaussian_splats.encoding'),
    'logit',
    'opacity field has encoding metadata'
  );

  const sphericalHarmonicField = table.data.schema.fields.find(field => field.name === 'f_rest_44');
  t.equal(
    sphericalHarmonicField?.metadata.get('loaders_gl.gaussian_splats.semantic'),
    'spherical_harmonic_rest',
    'SH rest field has semantic metadata'
  );
  t.ok(table.data.getChild('f_rest_44'), 'last SH rest coefficient was preserved');
  t.ok(table.data.getChild('scale_0'), 'scale_0 column was preserved');
  t.ok(table.data.getChild('rot_3'), 'rot_3 column was preserved');
  t.end();
});

test('PLYLoader#parseInBatches(gaussian splat binary fixture, arrow-table)', async t => {
  const response = await fetchFile(GAUSSIAN_SPLAT_BINARY_URL);
  const batches = await parseInBatches(makeIterator(response), PLYLoader, {
    batchSize: 400,
    ply: {shape: 'arrow-table'}
  });
  const batchRowCounts = [];

  for await (const table of batches) {
    t.equal(table.shape, 'arrow-table', 'batch has arrow-table shape');
    t.equal(
      table.data.schema.metadata.get('loaders_gl.semantic_type'),
      'gaussian-splats',
      'batch schema identifies Gaussian splat data'
    );
    t.ok(table.data.getChild('POSITION'), 'batch includes POSITION column');
    t.ok(table.data.getChild('scale_0'), 'batch includes scale_0 column');
    batchRowCounts.push(table.data.numRows);
  }

  t.deepEqual(batchRowCounts, [400, 400, 200], 'binary PLY emits requested Arrow batches');
  t.end();
});

test('PLYLoader#parseInBatches(gaussian splat binary fixture, arrow-table, chunk boundaries)', async t => {
  const response = await fetchFile(GAUSSIAN_SPLAT_BINARY_URL);
  const arrayBuffer = await response.arrayBuffer();
  const batches = await parseInBatches(makeChunkIterator(arrayBuffer, 777), PLYLoader, {
    batchSize: 333,
    ply: {shape: 'arrow-table'}
  });
  const batchRowCounts = [];

  for await (const table of batches) {
    batchRowCounts.push(table.data.numRows);
  }

  t.deepEqual(batchRowCounts, [333, 333, 333, 1], 'batches span input chunk boundaries');
  t.end();
});

test('PLYLoader#parseInBatches(ascii point cloud, arrow-table)', async t => {
  const batches = await parseInBatches(makeTextIterator(ASCII_POINT_CLOUD_PLY), PLYLoader, {
    batchSize: 2,
    ply: {shape: 'arrow-table'}
  });
  const batchRowCounts = [];

  for await (const table of batches) {
    t.equal(table.shape, 'arrow-table', 'batch has arrow-table shape');
    t.ok(table.data.getChild('POSITION'), 'batch includes POSITION column');
    t.ok(table.data.getChild('intensity'), 'batch includes custom scalar column');
    batchRowCounts.push(table.data.numRows);
  }

  t.deepEqual(batchRowCounts, [2, 1], 'ASCII point cloud emits requested Arrow batches');
  t.end();
});

test('PLYLoader#parseInBatches(binary vertex list properties, arrow-table)', async t => {
  const arrayBuffer = makeBinaryVertexListPLY();
  const elementTables = parsePLYToElementTables(arrayBuffer);
  const vertexTable = elementTables.elements[0].table;

  t.ok(
    vertexTable.getChild('neighbors')?.type instanceof arrow.List,
    'raw vertex list property is an Arrow list'
  );
  t.deepEqual(
    Array.from(vertexTable.getChild('neighbors').get(1)),
    [0, 2],
    'binary list values are preserved'
  );

  const batches = await parseInBatches(makeChunkIterator(arrayBuffer, 11), PLYLoader, {
    batchSize: 2,
    ply: {shape: 'arrow-table'}
  });
  const batchRowCounts = [];

  for await (const table of batches) {
    batchRowCounts.push(table.data.numRows);
  }

  t.deepEqual(batchRowCounts, [2, 1], 'binary variable-width vertex PLY emits Arrow batches');
  t.end();
});

test('PLYLoader#parse(arrow-first mesh parity with legacy parser)', async t => {
  const response = await fetchFile(PLY_CUBE_ATT_URL);
  const arrayBuffer = await response.arrayBuffer();
  const arrowFirstMesh = parseSync(arrayBuffer, PLYLoader);
  const legacyMesh = parseSync(arrayBuffer, PLYLoader, {
    ply: {_useLegacyParser: true}
  });

  t.deepEqual(
    Array.from(arrowFirstMesh.attributes.POSITION.value),
    Array.from(legacyMesh.attributes.POSITION.value),
    'arrow-first mesh preserves positions'
  );
  t.deepEqual(
    Array.from(arrowFirstMesh.indices.value),
    Array.from(legacyMesh.indices.value),
    'arrow-first mesh preserves triangulated indices'
  );
  t.end();
});

function* makeChunkIterator(arrayBuffer, chunkSize) {
  for (let byteOffset = 0; byteOffset < arrayBuffer.byteLength; byteOffset += chunkSize) {
    yield arrayBuffer.slice(byteOffset, byteOffset + chunkSize);
  }
}

function* makeTextIterator(text) {
  yield new TextEncoder().encode(text).buffer;
}

function makeBinaryVertexListPLY() {
  const header = [
    'ply',
    'format binary_little_endian 1.0',
    'element vertex 3',
    'property float x',
    'property float y',
    'property float z',
    'property list uchar int neighbors',
    'end_header',
    ''
  ].join('\n');
  const rows = [
    {position: [0, 0, 0], neighbors: [1]},
    {position: [1, 2, 3], neighbors: [0, 2]},
    {position: [4, 5, 6], neighbors: []}
  ];
  const bodyByteLength = rows.reduce(
    (byteLength, row) => byteLength + 12 + 1 + row.neighbors.length * 4,
    0
  );
  const headerBytes = new TextEncoder().encode(header);
  const bytes = new Uint8Array(headerBytes.length + bodyByteLength);
  bytes.set(headerBytes, 0);
  const dataView = new DataView(bytes.buffer);
  let byteOffset = headerBytes.length;

  for (const row of rows) {
    for (const coordinate of row.position) {
      dataView.setFloat32(byteOffset, coordinate, true);
      byteOffset += 4;
    }
    dataView.setUint8(byteOffset, row.neighbors.length);
    byteOffset++;
    for (const neighbor of row.neighbors) {
      dataView.setInt32(byteOffset, neighbor, true);
      byteOffset += 4;
    }
  }

  return bytes.buffer;
}

test('PLYLoader#parseSync(binary)', async t => {
  const arrayBuffer = await fetchFile(PLY_BUN_ZIPPER_URL).then(res => res.arrayBuffer());
  const data = parseSync(arrayBuffer, PLYLoader);

  validateMeshCategoryData(t, data);
  t.equal(data.attributes.POSITION.value.length, 107841, 'POSITION attribute was found');
  t.equal(data.attributes.confidence.value.length, 35947, 'confidence attribute was found');
  t.equal(data.attributes.intensity.value.length, 35947, 'intensity attribute was found');
  t.end();
});

test('PLYLoader#parse(WORKER)', async t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await load(PLY_BUN_ZIPPER_URL, PLYWorkerLoader);

  validateMeshCategoryData(t, data);
  t.equal(data.attributes.POSITION.value.length, 107841, 'POSITION attribute was found');
  t.end();
});

// TODO - Update to use parseInBatches
test('PLYLoader#parseInBatches(text)', async t => {
  const response = await fetchFile(PLY_CUBE_ATT_URL);
  const batches = await parseInBatches(makeIterator(response), PLYLoader);

  for await (const data of batches) {
    validateMeshCategoryData(t, data);
    t.equal(data.indices.value.length, 36, 'Indices found');
    t.equal(data.attributes.POSITION.value.length, 72, 'POSITION attribute was found');
    t.equal(data.attributes.NORMAL.value.length, 72, 'NORMAL attribute was found');
    t.end();
    return;
  }
});
