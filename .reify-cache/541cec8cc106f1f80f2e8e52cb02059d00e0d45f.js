"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var load,parseSync,fetchFile;module.link('@loaders.gl/core',{load(v){load=v},parseSync(v){parseSync=v},fetchFile(v){fetchFile=v}},1);var GLTFLoader,GLBParser,GLTFParser;module.link('@loaders.gl/gltf',{GLTFLoader(v){GLTFLoader=v},GLBParser(v){GLBParser=v},GLTFParser(v){GLTFParser=v}},2);/* eslint-disable max-len */





const GLTF_BINARY_URL = '@loaders.gl/gltf/test/data/gltf-2.0/2CylinderEngine.glb';
const GLTF_JSON_URL = '@loaders.gl/gltf/test/data/gltf-2.0/2CylinderEngine.gltf';

test('GLTFLoader#imports', t => {
  t.ok(GLTFLoader, 'GLTFLoader was imported');
  t.ok(GLTFParser, 'GLTFParser was imported');

  const gltfParser = new GLTFParser({});
  t.ok(gltfParser, 'GLTFParser was instantiated');

  t.end();
});

test('GLTFParser#parseSync(text/JSON)', async t => {
  const response = await fetchFile(GLTF_JSON_URL);
  const data = await response.text();

  let gltf = parseSync(data, GLTFLoader);
  t.ok(gltf, 'GLTFLoader returned parsed data');

  gltf = new GLTFParser().parseSync(data);
  t.ok(gltf, 'GLTFParser returned parsed data');

  t.end();
});

test('GLTFParser#parseSync(binary)', async t => {
  const response = await fetchFile(GLTF_BINARY_URL);
  const data = await response.arrayBuffer();

  let gltf = parseSync(data, GLTFLoader);
  t.ok(gltf, 'GLTFLoader returned parsed data');

  gltf = new GLTFParser().parseSync(data);
  t.ok(gltf, 'GLTFParser returned parsed data');

  const json = new GLBParser().parseSync(data).getJSON();
  gltf = new GLTFParser().parseSync(json);
  t.ok(gltf, 'GLBParser/GLTFParser combo returned parsed data');

  t.end();
});

test('GLTFLoader#load(binary)', async t => {
  const data = await load(GLTF_BINARY_URL, GLTFLoader);
  t.ok(data.asset, 'GLTFLoader returned parsed data');
  t.end();
});

test('GLTFLoader#load(text)', async t => {
  const data = await load(GLTF_JSON_URL, GLTFLoader);
  t.ok(data.asset, 'GLTFLoader returned parsed data');
  t.end();
});
