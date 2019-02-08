/* eslint-disable max-len */
import test from 'tape-catch';
import {parseFileSync, getGLTFAttribute, _getMeshSize} from '@loaders.gl/core';
import {loadBinaryFile} from '@loaders.gl/core-node';
import {DracoLoader, DracoEncoder} from '@loaders.gl/draco';
import path from 'path';
import {validateLoadedData} from '../conformance';

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
  const data = parseFileSync(BUNNY_DRC, DracoLoader);
  validateLoadedData(t, data);

  // t.comment(JSON.stringify(data));
  t.equal(getGLTFAttribute(data, 'POSITION').value.length, 104502, 'position attribute was found');

  const meshAttributes = {
    POSITION: getGLTFAttribute(data, 'POSITION').value,
    indices: data.indices.value
  };
  const pointCloudAttributes = Object.assign({}, meshAttributes);
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
      const data2 = parseFileSync(compressedMesh, DracoLoader);
      validateLoadedData(t, data2);

      // t.comment(JSON.stringify(data));
      t.equal(getGLTFAttribute(data2, 'POSITION').value.length, 104502,
        `${tc.title} decoded position attribute was found`);
    }
  }

  t.end();
});
