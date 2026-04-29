/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader, validateMeshCategoryData} from 'test/common/conformance';
import {validateArrowTableSchema} from '@loaders.gl/arrow';
import {indexedMeshArrowSchema} from '@loaders.gl/schema';

import {PLYLoader, PLYWorkerLoader} from '@loaders.gl/ply';
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
