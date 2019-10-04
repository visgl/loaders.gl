import test from 'tape-promise/tape';
import {validateWriter, validatePointCloudCategoryData} from 'test/common/conformance';

import {DracoWriter, DracoLoader} from '@loaders.gl/draco';
import {encode, fetchFile, parse} from '@loaders.gl/core';
import {_getMeshSize} from '@loaders.gl/loader-utils';

const TEST_CASES = [
  {
    title: 'Encoding Draco Mesh: SEQUENTIAL',
    options: {
      method: 'MESH_SEQUENTIAL_ENCODING'
    }
  },
  {
    title: 'Encoding Draco Mesh: EDGEBREAKER',
    options: {
      method: 'MESH_EDGEBREAKER_ENCODING'
    }
  },
  {
    title: 'Encoding Draco PointCloud (no indices)',
    options: {
      pointcloud: true
    }
  }
];

const BUNNY_DRC_URL = '@loaders.gl/draco/test/data/bunny.drc';

async function loadBunny() {
  const response = await fetchFile(BUNNY_DRC_URL);
  const arrayBuffer = await response.arrayBuffer();
  // Decode Loaded Mesh to use as input data for encoders
  return await parse(arrayBuffer, DracoLoader);
}

test('DracoWriter#loader conformance', t => {
  validateWriter(t, DracoWriter, 'DracoWriter');
  t.end();
});

test('DracoWriter#encode(bunny.drc)', async t => {
  const data = await loadBunny();
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');

  const MESH = {
    attributes: {
      POSITION: data.attributes.POSITION.value
    },
    indices: data.indices.value
  };
  const POINTCLOUD = {
    attributes: {
      POSITION: data.attributes.POSITION.value
    }
  };

  for (const tc of TEST_CASES) {
    const mesh = tc.options.pointcloud ? POINTCLOUD : MESH;
    const meshSize = _getMeshSize(mesh.attributes);

    const compressedMesh = await encode(mesh, DracoWriter, tc.options);
    const ratio = meshSize / compressedMesh.byteLength;
    t.comment(`${tc.title} ${compressedMesh.byteLength} bytes, ratio ${ratio.toFixed(1)}`);

    if (!tc.options.pointcloud) {
      // Decode the mesh
      const data2 = await parse(compressedMesh, DracoLoader);
      validatePointCloudCategoryData(t, data2);

      // t.comment(JSON.stringify(data));
      t.equal(
        data2.attributes.POSITION.value.length,
        data.attributes.POSITION.value.length,
        `${tc.title} decoded POSITION length matched`
      );
    }
  }

  t.end();
});

test('DracoParser#encode(bunny.drc)', async t => {
  const data = await loadBunny();
  validatePointCloudCategoryData(t, data);
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');

  const meshAttributes = {
    POSITION: data.attributes.POSITION.value,
    indices: data.indices.value
  };
  const pointCloudAttributes = {
    POSITION: data.attributes.POSITION.value
  };

  for (const tc of TEST_CASES) {
    const attributes = tc.options.pointcloud ? pointCloudAttributes : meshAttributes;
    const meshSize = _getMeshSize(attributes);

    const compressedMesh = await encode(attributes, DracoWriter, tc.options);

    const ratio = meshSize / compressedMesh.byteLength;
    t.comment(`${tc.title} ${compressedMesh.byteLength} bytes, ratio ${ratio.toFixed(1)}`);

    if (!tc.options.pointcloud) {
      // Decode the mesh
      const data2 = await parse(compressedMesh, DracoLoader);
      validatePointCloudCategoryData(t, data2);

      // t.comment(JSON.stringify(data));
      t.equal(
        data2.attributes.POSITION.value.length,
        data.attributes.POSITION.value.length,
        `${tc.title} decoded POSITION length matched`
      );
    }
  }

  t.end();
});
