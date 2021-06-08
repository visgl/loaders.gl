/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {fetchFile, parse, encode} from '@loaders.gl/core';
import {_getMeshSize} from '@loaders.gl/loader-utils';
import {DracoWriter, DracoLoader} from '@loaders.gl/draco';
import {validateMeshCategoryData} from 'test/common/conformance';

const POSITIONS_URL = '@loaders.gl/draco/test/data/raw-attribute-buffers/lidar-positions.bin';
const COLORS_URL = '@loaders.gl/draco/test/data/raw-attribute-buffers/lidar-colors.bin';

test('DracoWriter#compressRawBuffers', async (t) => {
  const POSITIONS = await fetchFile(POSITIONS_URL).then((response) => response.arrayBuffer());
  const COLORS = await fetchFile(COLORS_URL).then((response) => response.arrayBuffer());

  const attributes = {
    POSITION: new Float32Array(POSITIONS),
    COLOR_0: new Uint8ClampedArray(COLORS)
  };

  t.comment(
    `Encoding ${attributes.POSITION.length} positions, ${attributes.COLOR_0.length} colors...`
  );

  // Encode mesh
  // TODO - Replace with draco writer
  const compressedMesh = await encode({attributes}, DracoWriter, {draco: {pointcloud: true}});
  const meshSize = _getMeshSize(attributes);
  const ratio = meshSize / compressedMesh.byteLength;
  t.comment(`Draco compression ${compressedMesh.byteLength} bytes, ratio ${ratio.toFixed(1)}`);

  // Ensure we can parse it
  const data2 = await parse(compressedMesh, DracoLoader);
  validateMeshCategoryData(t, data2);

  t.equal(data2.attributes.POSITION.value.length, attributes.POSITION.length, 'POSITION matched');
  t.equal(data2.attributes.COLOR_0.value.length, attributes.COLOR_0.length, 'COLOR matched');

  t.end();
});
