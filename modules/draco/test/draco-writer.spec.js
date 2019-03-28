/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {encodeFileSync, fetchFile, parseFileSync, _getMeshSize} from '@loaders.gl/core';
import {DracoLoader, DracoWriter, DracoBuilder} from '@loaders.gl/draco';
import {validateLoadedData} from 'test/common/conformance';

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
  return parseFileSync(arrayBuffer, DracoLoader);
}

test('DracoWriter#encodeFileSync(bunny.drc)', async t => {
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

    let compressedMesh;
    t.doesNotThrow(() => {
      compressedMesh = encodeFileSync(mesh, DracoWriter, tc.options);
      const ratio = meshSize / compressedMesh.byteLength;
      t.comment(`${tc.title} ${compressedMesh.byteLength} bytes, ratio ${ratio.toFixed(1)}`);
    }, `${tc.title} did not trow`);

    if (!tc.options.pointcloud) {
      // Decode the mesh
      const data2 = parseFileSync(compressedMesh, DracoLoader);
      validateLoadedData(t, data2);

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
  validateLoadedData(t, data);
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

    let compressedMesh;

    t.doesNotThrow(() => {
      const dracoBuilder = new DracoBuilder();
      compressedMesh = dracoBuilder.encodeSync(attributes, tc.options);

      const ratio = meshSize / compressedMesh.byteLength;
      t.comment(`${tc.title} ${compressedMesh.byteLength} bytes, ratio ${ratio.toFixed(1)}`);
      dracoEncoder.destroy();
    }, `${tc.title} did not trow`);

    if (!tc.options.pointcloud) {
      // Decode the mesh
      const data2 = parseFileSync(compressedMesh, DracoLoader);
      validateLoadedData(t, data2);

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
