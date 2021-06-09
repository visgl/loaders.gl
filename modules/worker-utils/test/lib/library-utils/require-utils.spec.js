// Fork of https://github.com/floatdrop/require-from-string/blob/master/index.js
// Copyright (c) Vsevolod Strukchinsky <floatdrop@gmail.com> (github.com/floatdrop)
// MIT license

import test from 'tape-promise/tape';
import fs from 'fs';
import {isBrowser} from '@loaders.gl/worker-utils';
import {
  requireFromFile,
  requireFromString
} from '@loaders.gl/worker-utils/lib/node/require-utils.node';

const MODULE_URL = `${__dirname}/fixture/module.js`;
const SUBMODULE_URL = `${__dirname}/fixture/submodule.js`;

test('require-utils', (tt) => {
  if (isBrowser) {
    tt.end();
    return;
  }

  test('requireFromFile#', (t) => {
    t.ok(requireFromFile(MODULE_URL), 'Require from file worked');
    t.ok(requireFromFile(SUBMODULE_URL), 'Require from file worked');
    t.end();
  });

  test('requireFromString#should accept only string as code', (t) => {
    t.throws(() => requireFromString(), /code must be a string, not undefined/);
    t.end();
  });

  test('requireFromString#should require from string', (t) => {
    t.equal(requireFromString('module.exports = 1;'), 1);
    t.end();
  });

  test('requireFromString#should accept filename', (t) => {
    t.throws(() => requireFromString('module.exports = ', 'bug.js', /bug\.js|Unexpected token }/));
    t.end();
  });

  test('requireFromString#should work with relative require in file', (t) => {
    const code = fs.readFileSync(MODULE_URL, 'utf8');
    const result = requireFromString(code, MODULE_URL);

    t.ok(result);
    // TODO
    // t.equal(module, result.parent.parent);
    t.end();
  });

  test('requireFromString#should have appended and preppended paths', (t) => {
    const code = fs.readFileSync(SUBMODULE_URL, 'utf8');
    const result = requireFromString(code, SUBMODULE_URL, {
      appendPaths: ['append'],
      prependPaths: ['prepend']
    });

    t.ok(result);
    t.equal(result.paths.indexOf('append'), result.paths.length - 1);
    t.equal(result.paths.indexOf('prepend'), 0);
    t.end();
  });

  // TODO
  test.skip('requireFromString#should have meaningful error message', (t) => {
    try {
      requireFromString('throw new Error("Boom!");');
    } catch (error) {
      t.ok(/\(<anonymous>:1:69\)/.test(error.stack), 'should contain (<anonymous>:1:69) in stack');
    }

    try {
      requireFromString('throw new Error("Boom!");', '');
    } catch (error) {
      t.ok(/\(<anonymous>:1:69\)/.test(error.stack), 'should contain (<anonymous>:1:69) in stack');
    }
    t.end();
  });

  test('requireFromString#should cleanup parent.children', (t) => {
    const code = fs.readFileSync(SUBMODULE_URL, 'utf8');
    const result = requireFromString(code, SUBMODULE_URL);

    t.ok(module.children.indexOf(result) === -1);
    t.end();
  });

  tt.end();
});
