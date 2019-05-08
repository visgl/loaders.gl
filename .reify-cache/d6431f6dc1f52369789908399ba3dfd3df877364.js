"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var setPathPrefix,getPathPrefix,resolvePath;module.link('@loaders.gl/core',{setPathPrefix(v){setPathPrefix=v},getPathPrefix(v){getPathPrefix=v},resolvePath(v){resolvePath=v}},1);


// NOTE: addAliases is not a public export, already used by test setup
// import {addAliases} from '@loaders.gl/core';

test('file aliases#imports', t => {
  t.ok(typeof setPathPrefix === 'function', 'setPathPrefix() defined');
  t.ok(typeof getPathPrefix === 'function', 'getPathPrefix() defined');
  t.ok(typeof resolvePath === 'function', 'resolvePath() defined');
  t.end();
});

test('file aliases#path prefix', t => {
  t.equal(getPathPrefix(), '', 'getPathPrefix() return correct value');
  setPathPrefix('/tmp');
  t.equal(getPathPrefix(), '/tmp', 'getPathPrefix() return correct value');
  // Make sure to reset so we don't break other tests!
  setPathPrefix('');
  t.end();
});
