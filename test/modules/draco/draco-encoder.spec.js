/* eslint-disable max-len */
import test from 'tape-catch';
import {_getMeshSize} from '@loaders.gl/core';
import {loadBinaryFile} from '@loaders.gl/core-node';
import {DracoLoader, DracoEncoder} from '@loaders.gl/draco';
import path from 'path';

const BUNNY_DRC =
  loadBinaryFile(path.resolve(__dirname, '../../data/draco/bunny.drc')) ||
  require('test-data/draco/bunny.drc');

const TEST_CASES = [
  {
    title: 'Encoding Draco Mesh: SEQUENTIAL',
    options: {method: 'MESH_SEQUENTIAL_ENCODING'}
  },
  {
    title: 'Encoding Draco Mesh: EDGEBREAKER',
    options: {method: 'MESH_EDGEBREAKER_ENCODING'}
  },
  {
    title: 'Encoding Draco PointCloud (no indices)',
    options: {},
    type: 'pointcloud'
  }
];

test('DracoEncoder#encode(bunny.drc)', t => {
  // Decode Loaded Mesh and use as input data for encoders
  const data = DracoLoader.parseBinary(BUNNY_DRC);
  t.ok(data.header, 'Documents were found');
  // t.comment(JSON.stringify(data));
  t.equal(data.attributes.POSITION.length, 104502, 'position attribute was found');

  const meshAttributes = data.attributes;
  const pointCloudAttributes = Object.assign({}, data.attributes);
  delete pointCloudAttributes.indices;

  for (const tc of TEST_CASES) {
    let compressedMesh;

    t.doesNotThrow(
      () => {
        const dracoEncoder = new DracoEncoder();
        dracoEncoder.setOptions(tc.method);

        let meshSize;
        if (tc.type === 'pointcloud') {
          compressedMesh = dracoEncoder.encodePointCloud(pointCloudAttributes);
          meshSize = _getMeshSize(pointCloudAttributes);
        } else {
          compressedMesh = dracoEncoder.encodeMesh(meshAttributes);
          meshSize = _getMeshSize(meshAttributes);
        }

        const ratio = meshSize / compressedMesh.byteLength;
        t.comment(`${tc.title} ${compressedMesh.byteLength} bytes, ratio ${ratio.toFixed(1)}`);
        dracoEncoder.destroy();
      },
      `${tc.title} did not trow`
    );

    if (tc.type !== 'pointcloud') {
      // Decode the mesh
      const data2 = DracoLoader.parseBinary(compressedMesh);
      t.ok(data2.header, 'Documents were found');
      // t.comment(JSON.stringify(data));
      t.equal(data2.attributes.POSITION.length, 104502,
        `${tc.title} decoded position attribute was found`);
    }
  }

  t.end();
});
