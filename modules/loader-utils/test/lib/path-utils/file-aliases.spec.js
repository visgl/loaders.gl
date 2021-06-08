import test from 'tape-promise/tape';

import {setPathPrefix, getPathPrefix, resolvePath} from '@loaders.gl/loader-utils';

// NOTE: addAliases is not a public export, already used by test setup
// import {_addAliases} from '@loaders.gl/loader-utils';

test('file aliases#imports', (t) => {
  t.ok(typeof setPathPrefix === 'function', 'setPathPrefix() defined');
  t.ok(typeof getPathPrefix === 'function', 'getPathPrefix() defined');
  t.ok(typeof resolvePath === 'function', 'resolvePath() defined');
  t.end();
});

test('file aliases#path prefix', (t) => {
  t.equal(getPathPrefix(), '', 'getPathPrefix() return correct value');
  setPathPrefix('/tmp/');
  t.equal(getPathPrefix(), '/tmp/', 'getPathPrefix() return correct value');
  t.equal(resolvePath('geo.json'), '/tmp/geo.json');
  // Make sure to reset so we don't break other tests!
  setPathPrefix('');
  t.equal(resolvePath('geo.json'), 'geo.json');
  t.end();
});
