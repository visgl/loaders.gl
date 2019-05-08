"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var getGLTFAccessors,getGLTFAccessor;module.link('@loaders.gl/gltf/gltf/gltf-attribute-utils',{getGLTFAccessors(v){getGLTFAccessors=v},getGLTFAccessor(v){getGLTFAccessor=v}},1);


// Check if an attribute contains indices

test('getGLTFAccessors', t => {
  t.ok(getGLTFAccessors);
  t.ok(getGLTFAccessor);
  t.end();
});
