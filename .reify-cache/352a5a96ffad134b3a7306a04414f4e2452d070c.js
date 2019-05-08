"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var fetchFile;module.link('@loaders.gl/core',{fetchFile(v){fetchFile=v}},1);var GLTFBuilder,GLTFParser;module.link('@loaders.gl/gltf',{GLTFBuilder(v){GLTFBuilder=v},GLTFParser(v){GLTFParser=v}},2);var DracoWriter,DracoLoader;module.link('@loaders.gl/draco',{DracoWriter(v){DracoWriter=v},DracoLoader(v){DracoLoader=v}},3);/* eslint-disable max-len */






test('GLTFBuilder#addCompressedPointCloud', async t => {
  let response = await fetchFile(
    '@loaders.gl/draco/test/data/raw-attribute-buffers/lidar-positions.bin'
  );
  const POSITIONS = await response.arrayBuffer();
  response = await fetchFile(
    '@loaders.gl/draco/test/data/raw-attribute-buffers/lidar-positions.bin'
  );
  const COLORS = await response.arrayBuffer();

  const attributes = {
    POSITIONS: new Float32Array(POSITIONS),
    COLORS: new Uint8ClampedArray(COLORS)
  };
  t.comment(
    `Encoding ${attributes.POSITIONS.length} positions, ${attributes.COLORS.length} colors...`
  );

  const gltfBuilder = new GLTFBuilder({DracoWriter, DracoLoader});
  t.equal(gltfBuilder.addCompressedPointCloud(attributes), 0, 'valid index for point cloud data');

  const arrayBuffer = gltfBuilder.encodeAsGLB();

  const parser = new GLTFParser();
  parser.parseSync(arrayBuffer, {DracoLoader, decompress: false});
  // TODO - verify that requiredExtensions contain UBER_draco_point_cloud_compression
  let dracoExtension = parser.getRequiredExtension('UBER_draco_point_cloud_compression');
  t.ok(dracoExtension, 'toplevel extension has not been removed');
  let mesh = parser.getMesh(0);
  t.ok(mesh.primitives[0].extensions.UBER_draco_point_cloud_compression);
  t.notEqual(
    mesh.primitives[0].extensions.UBER_draco_point_cloud_compression.bufferView,
    undefined
  );

  parser.parseSync(arrayBuffer, {DracoLoader, decompress: true});
  mesh = parser.getMesh(0);
  dracoExtension = parser.getRequiredExtension('UBER_draco_point_cloud_compression');
  t.notOk(dracoExtension, 'toplevel extension has been removed');
  t.equal(mesh.primitives[0].mode, 0, 'mesh mode ok');
  t.notOk(
    mesh.primitives[0].extensions.UBER_draco_point_cloud_compression,
    'extension has been removed'
  );
  t.equal(
    mesh.primitives[0].attributes.POSITION.value.length,
    attributes.POSITIONS.length,
    'position attribute was found'
  );
  t.equal(
    mesh.primitives[0].attributes.COLOR_0.value.length,
    attributes.COLORS.length,
    'color attribute was found'
  );

  t.end();
});
