import {expect, test} from 'vitest';
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
function validateTextPLY(data) {
  expect(data.indices.value.length, 'Indices found').toBe(36);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(72);
  expect(data.attributes.NORMAL.value.length, 'NORMAL attribute was found').toBe(72);
}
test('PLYLoader#loader conformance', () => {
  validateLoader(PLYLoader, 'PLYLoader');
  validateLoader(PLYWorkerLoader, 'PLYWorkerLoader');
});
test('PLYLoader#parse(textFile)', async () => {
  const data = await parse(fetchFile(PLY_CUBE_ATT_URL), PLYLoader, {});
  validateMeshCategoryData(data);
  validateTextPLY(data);
});
test('PLYLoader#parse(shape: arrow-table)', async () => {
  const table = await parse(fetchFile(PLY_CUBE_ATT_URL), PLYLoader, {
    ply: {shape: 'arrow-table'}
  });
  expect(table.shape, 'table has arrow-table shape').toBe('arrow-table');
  validateArrowTableSchema(table.data, indexedMeshArrowSchema, {
    schemaName: 'PLYLoader IndexedMesh table'
  });
  expect(
    table.data.schema.fields.map(field => field.name),
    'indexed schema fields are first'
  ).toEqual(['POSITION', 'indices', 'NORMAL']);
  const indicesColumn = table.data.getChild('indices');
  expect(indicesColumn, 'indices column was found').toBeTruthy();
  expect(indicesColumn.get(0).length, 'indices were found in row 0').toBe(36);
  expect(indicesColumn.get(1), 'indices are null after row 0').toBe(null);
});
test('PLYLoader#parse(shape: arrow-table, pointCloud)', async () => {
  const table = await parse(fetchFile(PLY_CUBE_ATT_URL), PLYLoader, {
    ply: {shape: 'arrow-table', pointCloud: true}
  });
  expect(table.shape, 'table has arrow-table shape').toBe('arrow-table');
  expect(table.data.numRows, 'table has one row per vertex').toBe(24);
  expect(table.data.getChild('POSITION'), 'POSITION column was found').toBeTruthy();
  expect(
    table.data.getChild('indices'),
    'indices column is skipped in pointCloud mode'
  ).toBeFalsy();
});
test('PLYLoader#parse(raw element tables preserve list properties)', async () => {
  const response = await fetchFile(PLY_CUBE_ATT_URL);
  const elementTables = parsePLYToElementTables(await response.text());
  const faceTable = elementTables.elements.find(
    elementTable => elementTable.element.name === 'face'
  );
  expect(faceTable, 'face element table was found').toBeTruthy();
  expect(
    faceTable.table.getChild('vertex_indices')?.type instanceof arrow.List,
    'face indices are an Arrow list'
  ).toBeTruthy();
  expect(
    faceTable.table.getChild('texcoord')?.type instanceof arrow.List,
    'face texcoords are an Arrow list'
  ).toBeTruthy();
  expect(
    Array.from(faceTable.table.getChild('vertex_indices').get(0)),
    'face vertex indices are preserved before mesh conversion'
  ).toEqual([9, 11, 13]);
  expect(
    faceTable.table.getChild('texcoord').get(0).length,
    'face texcoord list is preserved'
  ).toBe(6);
});
test('PLYLoader#parse(binary)', async () => {
  const data = await parse(fetchFile(PLY_BUN_BINARY_URL), PLYLoader);
  validateMeshCategoryData(data);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(104502);
});
test('PLYLoader#parse(ascii)', async () => {
  const data = await parse(fetchFile(PLY_BUN_ZIPPER_URL), PLYLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(data);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(107841);
  expect(data.attributes.confidence.value.length, 'confidence attribute was found').toBe(35947);
  expect(data.attributes.intensity.value.length, 'intensity attribute was found').toBe(35947);
});
test('PLYLoader#parse(gaussian splat metadata)', async () => {
  const table = parseSync(GAUSSIAN_SPLAT_PLY, PLYLoader, {
    ply: {shape: 'arrow-table'}
  });
  expect(table.shape, 'table has arrow-table shape').toBe('arrow-table');
  expect(table.data.numRows, 'table has one row per splat').toBe(2);
  expect(
    table.data.schema.metadata.get('loaders_gl.semantic_type'),
    'schema identifies Gaussian splat data'
  ).toBe('gaussian-splats');
  const scaleField = table.data.schema.fields.find(field => field.name === 'scale_0');
  expect(
    scaleField?.metadata.get('loaders_gl.gaussian_splats.semantic'),
    'scale field has semantic metadata'
  ).toBe('scale');
  expect(
    scaleField?.metadata.get('loaders_gl.gaussian_splats.encoding'),
    'scale field has encoding metadata'
  ).toBe('log');
  const opacityField = table.data.schema.fields.find(field => field.name === 'opacity');
  expect(
    opacityField?.metadata.get('loaders_gl.gaussian_splats.encoding'),
    'opacity field has encoding metadata'
  ).toBe('logit');
  expect(table.data.getChild('f_dc_0'), 'f_dc_0 column was preserved').toBeTruthy();
  expect(table.data.getChild('scale_0'), 'scale_0 column was preserved').toBeTruthy();
  expect(table.data.getChild('rot_0'), 'rot_0 column was preserved').toBeTruthy();
});
test('PLYLoader#parse(gaussian splat binary fixture)', async () => {
  const table = await parse(fetchFile(GAUSSIAN_SPLAT_BINARY_URL), PLYLoader, {
    ply: {shape: 'arrow-table'}
  });
  expect(table.shape, 'table has arrow-table shape').toBe('arrow-table');
  expect(table.data.numRows, 'table has one row per fixture splat').toBe(1000);
  expect(table.data.schema.fields.length, 'schema has expected normalized PLY columns').toBe(58);
  expect(
    table.data.schema.metadata.get('loaders_gl.semantic_type'),
    'schema identifies Gaussian splat data'
  ).toBe('gaussian-splats');
  const plyElements = JSON.parse(table.data.schema.metadata.get('ply_elements'));
  expect(plyElements[0].name, 'schema preserves PLY vertex element metadata').toBe('vertex');
  expect(plyElements[0].count, 'schema preserves truncated vertex count').toBe(1000);
  expect(plyElements[0].properties.length, 'schema preserves source PLY property count').toBe(62);
  const positionField = table.data.schema.fields.find(field => field.name === 'POSITION');
  expect(
    positionField?.type instanceof arrow.FixedSizeList,
    'POSITION is a fixed size list'
  ).toBeTruthy();
  expect(positionField?.type.listSize, 'POSITION is a vec3').toBe(3);
  expect(table.data.getChild('POSITION'), 'POSITION column was preserved').toBeTruthy();
  const normalField = table.data.schema.fields.find(field => field.name === 'NORMAL');
  expect(
    normalField?.type instanceof arrow.FixedSizeList,
    'NORMAL is a fixed size list'
  ).toBeTruthy();
  expect(normalField?.type.listSize, 'NORMAL is a vec3').toBe(3);
  const scaleField = table.data.schema.fields.find(field => field.name === 'scale_0');
  expect(
    scaleField?.metadata.get('loaders_gl.gaussian_splats.semantic'),
    'scale field has semantic metadata'
  ).toBe('scale');
  expect(
    scaleField?.metadata.get('loaders_gl.gaussian_splats.encoding'),
    'scale field has encoding metadata'
  ).toBe('log');
  const opacityField = table.data.schema.fields.find(field => field.name === 'opacity');
  expect(
    opacityField?.metadata.get('loaders_gl.gaussian_splats.encoding'),
    'opacity field has encoding metadata'
  ).toBe('logit');
  const sphericalHarmonicField = table.data.schema.fields.find(field => field.name === 'f_rest_44');
  expect(
    sphericalHarmonicField?.metadata.get('loaders_gl.gaussian_splats.semantic'),
    'SH rest field has semantic metadata'
  ).toBe('spherical_harmonic_rest');
  expect(table.data.getChild('f_rest_44'), 'last SH rest coefficient was preserved').toBeTruthy();
  expect(table.data.getChild('scale_0'), 'scale_0 column was preserved').toBeTruthy();
  expect(table.data.getChild('rot_3'), 'rot_3 column was preserved').toBeTruthy();
});
test('PLYLoader#parseInBatches(gaussian splat binary fixture, arrow-table)', async () => {
  const response = await fetchFile(GAUSSIAN_SPLAT_BINARY_URL);
  const batches = await parseInBatches(makeIterator(response), PLYLoader, {
    batchSize: 400,
    ply: {shape: 'arrow-table'}
  });
  const batchRowCounts = [];
  for await (const table of batches) {
    expect(table.shape, 'batch has arrow-table shape').toBe('arrow-table');
    expect(table.batchType, 'batch has data batchType').toBe('data');
    expect(
      table.data.schema.metadata.get('loaders_gl.semantic_type'),
      'batch schema identifies Gaussian splat data'
    ).toBe('gaussian-splats');
    expect(table.data.getChild('POSITION'), 'batch includes POSITION column').toBeTruthy();
    expect(table.data.getChild('scale_0'), 'batch includes scale_0 column').toBeTruthy();
    batchRowCounts.push(table.data.numRows);
  }
  expect(batchRowCounts, 'binary PLY emits requested Arrow batches').toEqual([400, 400, 200]);
});
test('PLYLoader#parseInBatches(gaussian splat binary fixture, arrow-table, chunk boundaries)', async () => {
  const response = await fetchFile(GAUSSIAN_SPLAT_BINARY_URL);
  const arrayBuffer = await response.arrayBuffer();
  const batches = await parseInBatches(makeChunkIterator(arrayBuffer, 777), PLYLoader, {
    batchSize: 333,
    ply: {shape: 'arrow-table'}
  });
  const batchRowCounts = [];
  for await (const table of batches) {
    expect(table.batchType, 'batch has data batchType').toBe('data');
    batchRowCounts.push(table.data.numRows);
  }
  expect(batchRowCounts, 'batches span input chunk boundaries').toEqual([333, 333, 333, 1]);
});
test('PLYLoader#parseInBatches(ascii point cloud, arrow-table)', async () => {
  const batches = await parseInBatches(makeTextIterator(ASCII_POINT_CLOUD_PLY), PLYLoader, {
    batchSize: 2,
    ply: {shape: 'arrow-table'}
  });
  const batchRowCounts = [];
  for await (const table of batches) {
    expect(table.shape, 'batch has arrow-table shape').toBe('arrow-table');
    expect(table.batchType, 'batch has data batchType').toBe('data');
    expect(table.data.getChild('POSITION'), 'batch includes POSITION column').toBeTruthy();
    expect(table.data.getChild('intensity'), 'batch includes custom scalar column').toBeTruthy();
    batchRowCounts.push(table.data.numRows);
  }
  expect(batchRowCounts, 'ASCII point cloud emits requested Arrow batches').toEqual([2, 1]);
});
test('PLYLoader#parseInBatches(mesh PLY, arrow-table, pointCloud)', async () => {
  const response = await fetchFile(PLY_CUBE_ATT_URL);
  const sourceText = await response.text();
  const batches = await parseInBatches(makeTextIterator(sourceText), PLYLoader, {
    batchSize: 10,
    ply: {shape: 'arrow-table', pointCloud: true}
  });
  const batchRowCounts = [];
  for await (const table of batches) {
    expect(table.shape, 'batch has arrow-table shape').toBe('arrow-table');
    expect(table.batchType, 'batch has data batchType').toBe('data');
    expect(table.data.getChild('POSITION'), 'batch includes POSITION column').toBeTruthy();
    expect(table.data.getChild('indices'), 'batch skips mesh indices').toBeFalsy();
    batchRowCounts.push(table.data.numRows);
  }
  expect(batchRowCounts, 'pointCloud mode streams only vertex rows').toEqual([10, 10, 4]);
});
test('PLYLoader#parseInBatches(mesh PLY, arrow-table)', async () => {
  const response = await fetchFile(PLY_CUBE_ATT_URL);
  const sourceText = await response.text();
  const batches = await parseInBatches(makeTextIterator(sourceText), PLYLoader, {
    batchSize: 10,
    ply: {shape: 'arrow-table'}
  });
  try {
    for await (const table of batches) {
      (() => {
        throw new Error(`unexpected batch with ${table.data.numRows} rows`);
      })();
    }
    (() => {
      throw new Error('mesh PLY should not stream as Arrow table without pointCloud mode');
    })();
  } catch (error) {
    expect(String(error), 'mesh PLY requires pointCloud mode for Arrow table streaming').toMatch(
      /PLY arrow-table batch parsing requires one vertex element/
    );
  }
});
test('PLYLoader#parseInBatches(binary vertex list properties, arrow-table)', async () => {
  const arrayBuffer = makeBinaryVertexListPLY();
  const elementTables = parsePLYToElementTables(arrayBuffer);
  const vertexTable = elementTables.elements[0].table;
  expect(
    vertexTable.getChild('neighbors')?.type instanceof arrow.List,
    'raw vertex list property is an Arrow list'
  ).toBeTruthy();
  expect(
    Array.from(vertexTable.getChild('neighbors').get(1)),
    'binary list values are preserved'
  ).toEqual([0, 2]);
  const batches = await parseInBatches(makeChunkIterator(arrayBuffer, 11), PLYLoader, {
    batchSize: 2,
    ply: {shape: 'arrow-table'}
  });
  const batchRowCounts = [];
  for await (const table of batches) {
    batchRowCounts.push(table.data.numRows);
  }
  expect(batchRowCounts, 'binary variable-width vertex PLY emits Arrow batches').toEqual([2, 1]);
});
test('PLYLoader#parse(arrow-first mesh parity with legacy parser)', async () => {
  const response = await fetchFile(PLY_CUBE_ATT_URL);
  const arrayBuffer = await response.arrayBuffer();
  const arrowFirstMesh = parseSync(arrayBuffer, PLYLoader);
  const legacyMesh = parseSync(arrayBuffer, PLYLoader, {
    ply: {_useLegacyParser: true}
  });
  expect(
    Array.from(arrowFirstMesh.attributes.POSITION.value),
    'arrow-first mesh preserves positions'
  ).toEqual(Array.from(legacyMesh.attributes.POSITION.value));
  expect(
    Array.from(arrowFirstMesh.indices.value),
    'arrow-first mesh preserves triangulated indices'
  ).toEqual(Array.from(legacyMesh.indices.value));
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
test('PLYLoader#parseSync(binary)', async () => {
  const arrayBuffer = await fetchFile(PLY_BUN_ZIPPER_URL).then(res => res.arrayBuffer());
  const data = parseSync(arrayBuffer, PLYLoader);
  validateMeshCategoryData(data);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(107841);
  expect(data.attributes.confidence.value.length, 'confidence attribute was found').toBe(35947);
  expect(data.attributes.intensity.value.length, 'intensity attribute was found').toBe(35947);
});
test('PLYLoader#parse(WORKER)', async () => {
  if (typeof Worker === 'undefined') {
    console.log('Worker is not usable in non-browser environments');
    return;
  }
  const data = await load(PLY_BUN_ZIPPER_URL, PLYWorkerLoader);
  validateMeshCategoryData(data);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(107841);
});
// TODO - Update to use parseInBatches
test('PLYLoader#parseInBatches(text)', async () => {
  const response = await fetchFile(PLY_CUBE_ATT_URL);
  const batches = await parseInBatches(makeIterator(response), PLYLoader);
  for await (const data of batches) {
    validateMeshCategoryData(data);
    expect(data.indices.value.length, 'Indices found').toBe(36);
    expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(72);
    expect(data.attributes.NORMAL.value.length, 'NORMAL attribute was found').toBe(72);
    return;
  }
});
