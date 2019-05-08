"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var fetchFile,parseSync,encodeSync,_getMeshSize;module.link('@loaders.gl/core',{fetchFile(v){fetchFile=v},parseSync(v){parseSync=v},encodeSync(v){encodeSync=v},_getMeshSize(v){_getMeshSize=v}},1);var DracoWriter,DracoLoader;module.link('@loaders.gl/draco',{DracoWriter(v){DracoWriter=v},DracoLoader(v){DracoLoader=v}},2);var validateLoadedData;module.link('test/common/conformance',{validateLoadedData(v){validateLoadedData=v}},3);/* eslint-disable max-len */





const POSITIONS_URL = '@loaders.gl/draco/test/data/raw-attribute-buffers/lidar-positions.bin';
const COLORS_URL = '@loaders.gl/draco/test/data/raw-attribute-buffers/lidar-colors.bin';

test('DracoWriter#compressRawBuffers', async t => {
  const POSITIONS = await fetchFile(POSITIONS_URL).then(response => response.arrayBuffer());
  const COLORS = await fetchFile(COLORS_URL).then(response => response.arrayBuffer());

  const attributes = {
    POSITION: new Float32Array(POSITIONS),
    COLOR_0: new Uint8ClampedArray(COLORS)
  };

  t.comment(
    `Encoding ${attributes.POSITION.length} positions, ${attributes.COLOR_0.length} colors...`
  );

  // Encode mesh
  // TODO - Replace with draco writer
  const compressedMesh = encodeSync({attributes}, DracoWriter, {pointcloud: true});
  const meshSize = _getMeshSize(attributes);
  const ratio = meshSize / compressedMesh.byteLength;
  t.comment(`Draco compression ${compressedMesh.byteLength} bytes, ratio ${ratio.toFixed(1)}`);

  // Ensure we can parse it
  const data2 = parseSync(compressedMesh, DracoLoader);
  validateLoadedData(t, data2);

  t.equal(data2.attributes.POSITION.value.length, attributes.POSITION.length, 'POSITION matched');
  t.equal(data2.attributes.COLOR_0.value.length, attributes.COLOR_0.length, 'COLOR matched');

  t.end();
});
