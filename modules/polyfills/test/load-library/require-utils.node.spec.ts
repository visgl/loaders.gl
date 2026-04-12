// Fork of https://github.com/floatdrop/require-from-string/blob/master/index.js
// Copyright (c) Vsevolod Strukchinsky <floatdrop@gmail.com> (github.com/floatdrop)
// MIT license

import {expect, test} from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {requireFromFile, requireFromString} from '../../src/load-library/require-utils.node';

const DIR = path?.dirname?.(import.meta.url)?.replace('file://', '') || '.';
const MODULE_URL = `${DIR}/fixture/module.js`;
const SUBMODULE_URL = `${DIR}/fixture/submodule.js`;

test.skip('polyfills#requireFromFile#', () => {
  expect(requireFromFile(MODULE_URL), 'Require from file worked').toBeTruthy();
  expect(requireFromFile(SUBMODULE_URL), 'Require from file worked').toBeTruthy();
});

test('polyfills#requireFromString#should accept only string as code', () => {
  // @ts-expect-error
  expect(() => requireFromString()).toThrow(/code must be a string, not undefined/);
});

test('polyfills#requireFromString#should require from string', () => {
  expect(requireFromString('module.exports = 1;')).toBe(1);
});

test('polyfills#requireFromString#should accept filename', () => {
  expect(() => requireFromString('module.exports = ', 'bug.js')).toThrow(/bug\.js|Unexpected/);
});

test.skip('polyfills#requireFromString#should work with relative require in file', () => {
  const code = fs.readFileSync(MODULE_URL, 'utf8');
  const result = requireFromString(code, MODULE_URL);

  expect(result).toBeTruthy();
  // TODO
  // expect(module, result.parent.parent);
});

test.skip('polyfills#requireFromString#should have appended and preppended paths', () => {
  const code = fs.readFileSync(SUBMODULE_URL, 'utf8');
  const result = requireFromString(code, SUBMODULE_URL, {
    appendPaths: ['append'],
    prependPaths: ['prepend']
  });

  expect(result).toBeTruthy();
  expect(result.paths.indexOf('append')).toBe(result.paths.length - 1);
  expect(result.paths.indexOf('prepend')).toBe(0);
});

test.skip('requireFromString#should have meaningful error message', () => {
  try {
    requireFromString('throw new Error("Boom!");');
  } catch (error) {
    expect(
      /\(<anonymous>:1:69\)/.test(error.stack),
      'should contain (<anonymous>:1:69) in stack'
    ).toBeTruthy();
  }

  try {
    requireFromString('throw new Error("Boom!");', '');
  } catch (error) {
    expect(
      /\(<anonymous>:1:69\)/.test(error.stack),
      'should contain (<anonymous>:1:69) in stack'
    ).toBeTruthy();
  }
});

test.skip('polyfills#requireFromString#should cleanup parent.children', () => {
  const code = fs.readFileSync(SUBMODULE_URL, 'utf8');
  const result = requireFromString(code, SUBMODULE_URL);

  expect(module.children.indexOf(result) === -1).toBeTruthy();
});
