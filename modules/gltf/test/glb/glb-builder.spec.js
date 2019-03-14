/* eslint-disable max-len */
import test from 'tape-promise/tape';

import {GLBBuilder} from '@loaders.gl/gltf';
import unpackGLBBuffers from '@loaders.gl/gltf/glb/unpack-glb-buffers';

const BUFFERS = [
  new Int8Array([3, 2, 3]),
  new Uint16Array([6, 2, 4, 5]),
  new Float32Array([8, 2, 4, 5])
];

function validateGLBJsonFields(
  t,
  builder,
  {numBuffers = 1, numBufferViews = 0, numAccessors = 0, numImages = 0} = {}
) {
  const counts = builder._getInternalCounts();
  t.equal(counts.buffers, numBuffers, `buffers ${numBufferViews}`);
  t.equal(counts.bufferViews, numBufferViews, `bufferViews is ${numBufferViews}`);
  t.equal(counts.accessors, numAccessors, `accessors is ${numAccessors}`);
  t.equal(counts.images, numImages, `images is ${numImages}`);
}

test('GLBBuilder#encode with null json', t => {
  //  20 - header
  // 100 - json {"buffers":[{"byteLength":0}],"bufferViews":[],"accessors":[],"images":[],"meshes":[],"extras":null}
  //   8 - header
  // 128

  const TEST_JSON = null;

  const builder = new GLBBuilder();
  builder.addApplicationData('extras', TEST_JSON);
  const arrayBuffer = builder.encodeAsGLB();
  const resultJson = builder.json;

  t.equal(arrayBuffer.byteLength, 128, 'null json encoded with size 128');
  t.equal(builder.json, resultJson, 'json is null');
  validateGLBJsonFields(t, builder);

  t.end();
});

test('GLBBuilder#encode with empty object json', t => {
  //  20 - header
  //  98 - json {"buffers":[{"byteLength":0}],"bufferViews":[],"accessors":[],"images":[],"meshes":[],"extras":{}}
  //   2 - padding
  //   8 - header
  // 128
  const TEST_JSON = {};

  const builder = new GLBBuilder();
  builder.addApplicationData('extras', TEST_JSON);
  const arrayBuffer = builder.encodeAsGLB();
  const resultJson = builder.json.extras;

  t.equal(arrayBuffer.byteLength, 128, '[] json encoded with size of 128');
  t.equal(Object.keys(resultJson).length, 0, 'json has 0 keys in object');
  validateGLBJsonFields(t, builder);

  t.end();
});

test('GLBBuilder#encode with simple object json', t => {
  //  20 - header
  // 105 - json {"buffers":[{"byteLength":0}],"bufferViews":[],"accessors":[],"images":[],"meshes":[],"extras":{"num":1}}
  //   3 - padding
  //   8 - header
  // 136

  const TEST_JSON = {num: 1};

  const builder = new GLBBuilder();
  builder.addApplicationData('extras', TEST_JSON);
  const arrayBuffer = builder.encodeAsGLB();
  const resultJson = builder.json.extras;

  t.equal(arrayBuffer.byteLength, 136, 'object with 1 scalar json encoded with size of 136');
  t.equal(Object.keys(resultJson).length, 1, 'json has 1 keys in object');
  validateGLBJsonFields(t, builder);

  t.end();
});

test('GLBBuilder#encode with typed array json', t => {
  //  20 - header
  // 232 - json {"buffers":[{"byteLength":12}],"bufferViews":[{"buffer":0,"byteOffset":0,"byteLength":12}],"accessors":[{"bufferView":0,"type":"VEC3","componentType":5126,"count":1}],"images":[],,"meshes":[],"extras":{"typedArray":"#/accessors/0"}}
  //   8 - header
  //  12 - data
  // 272
  const TEST_JSON = {typedArray: new Float32Array([10.0, 11.0, 12.0])};

  const builder = new GLBBuilder();
  builder.addApplicationData('extras', TEST_JSON, {packTypedArrays: true});
  const arrayBuffer = builder.encodeAsGLB();

  const resultJson = builder.json.extras;

  t.equal(arrayBuffer.byteLength, 272, 'object with 1 typed array json encoded with size of 272');
  t.equal(Object.keys(resultJson).length, 1, 'json has 1 keys in object');
  t.ok(typeof resultJson.typedArray === 'string', 'encoded array should be an accessor string');
  validateGLBJsonFields(t, builder, {numBufferViews: 1, numAccessors: 1, numImages: 0});

  t.end();
});

test('GLBBuilder#encode with nested typed array json', t => {
  //  20 - header
  // 242 - json {"buffers":[{"byteLength":12}],"bufferViews":[{"buffer":0,"byteOffset":0,"byteLength":12}],"accessors":[{"bufferView":0,"type":"VEC3","componentType":5126,"count":1}],"images":[],"meshes":[],"extras":{"nested":{"typedArray":"#/accessors/0"}}}
  //   2 - padding
  //   8 - header
  //  12 - data
  // 284
  const TEST_JSON = {nested: {typedArray: new Float32Array([10.0, 11.0, 12.0])}};

  const builder = new GLBBuilder();
  builder.addApplicationData('extras', TEST_JSON, {packTypedArrays: true});
  const arrayBuffer = builder.encodeAsGLB();

  const resultJSON = builder.json.extras;
  t.equal(
    arrayBuffer.byteLength,
    284,
    'nested object with 1 typed array json encoded with size of 284'
  );
  t.equal(Object.keys(resultJSON).length, 1, 'json has 1 keys in object');
  t.ok(
    typeof resultJSON.nested.typedArray === 'string',
    'encoded array should be an accessor string'
  );
  validateGLBJsonFields(t, builder, {numBufferViews: 1, numAccessors: 1, numImages: 0});

  t.end();
});

test('GLBBuilder#encode complex', t => {
  // {
  // "buffers":[{"byteLength":36}],
  // "bufferViews":[{"buffer":0,"byteOffset":0,"byteLength":12},{"buffer":0,"byteOffset":12,"byteLength":12},{"buffer":0,"byteOffset":24,"byteLength":12}],
  // "accessors":[{"bufferView":0,"type":"VEC3","componentType":5126,"count":1},{"bufferView":1,"type":"VEC3","componentType":5126,"count":1},{"bufferView":2,"type":"VEC3","componentType":5126,"count":1}],
  // "images":[],
  // "meshes":[],
  // "extra":{"numy":12003.4,"stringy":"foobar","objy":{"foo":"bar"},"simpleArray":[1,2,3],"typedArray":"#/accessors/0","nestedSimpleArray":[[1,2,3],[11,12,13]],"nestedTypedArray":["#/accessors/1","#/accessors/2"]}
  // }
  const TEST_JSON = {
    numy: 12003.4,
    stringy: 'foobar',
    objy: {foo: 'bar'},
    simpleArray: [1, 2, 3],
    typedArray: new Float32Array([10.0, 11.0, 12.0]),
    nestedSimpleArray: [[1, 2, 3], [11, 12, 13]],
    nestedTypedArray: [new Float32Array([10.0, 11.0, 12.0]), new Float32Array([20.0, 21.0, 22.0])]
  };

  const builder = new GLBBuilder();
  builder.addApplicationData('extras', TEST_JSON, {packTypedArrays: true});
  const arrayBuffer = builder.encodeAsGLB();

  const resultJSON = builder.json.extras;
  t.equal(arrayBuffer.byteLength, 680, 'complex json encoded with size of 680');
  t.equal(Object.keys(resultJSON).length, 7, 'json has 7 keys in object');
  t.end();
});

// TODO(twojtasz): I removed the addImageEntry as this is a GLTF property change
// I think this test may be redundant with GLTF tests
test.skip('GLBBuilder#addImageEntry', t => {
  const builder = new GLBBuilder();
  const firstImageIndex = builder.addImageEntry(3, {
    mimeType: 'image/png',
    width: 100,
    height: 101
  });
  const secondImageIndex = builder.addImageEntry(2, {
    mimeType: 'image/png',
    width: 200,
    height: 201
  });

  t.equal(builder.json.images.length, 2, 'images has 2 entries');

  t.equal(firstImageIndex, 0, 'first addImageEntry has image index of 0');
  const expectedFirst = {bufferView: 3, width: 100, height: 101, mimeType: 'image/png'};
  t.deepEqual(builder.json.images[0], expectedFirst, 'first images entry matches');

  t.equal(secondImageIndex, 1, 'second addImageEntry has image index of 1');
  const expectedSecond = {bufferView: 2, width: 200, height: 201, mimeType: 'image/png'};
  t.deepEqual(builder.json.images[1], expectedSecond, 'second images entry matches');

  t.end();
});

test('pack-and-unpack-binary-buffers', t => {
  const glbBuilder = new GLBBuilder();

  // Add buffers
  for (const buffer of BUFFERS) {
    glbBuilder.addBuffer(buffer, {size: 1});
  }

  const {arrayBuffer, json} = glbBuilder._pack();

  t.equal(json.bufferViews[0].byteOffset, 0, 'should be equal');
  t.equal(json.bufferViews[0].byteLength, 3, 'should be equal');

  t.equal(json.bufferViews[1].byteOffset, 4, 'should be equal');
  t.equal(json.bufferViews[1].byteLength, 8, 'should be equal');

  t.equal(json.bufferViews[2].byteOffset, 12, 'should be equal');
  t.equal(json.bufferViews[2].byteLength, 16, 'should be equal');

  const buffers2 = unpackGLBBuffers(arrayBuffer, json);
  for (const key in buffers2.accessors) {
    delete buffers2.accessors[key].accessor;
  }

  t.comment(JSON.stringify(BUFFERS));
  t.comment(JSON.stringify(buffers2.accessors));
  t.deepEqual(BUFFERS, buffers2.accessors, 'should be deep equal');
  t.end();
});
