/* eslint-disable max-len */
import test from 'tape-catch';
import {readFileSync, parseFileSync, parseFile, getGLTFAttribute} from '@loaders.gl/core';
import {DracoLoader, DracoWorkerLoader} from '@loaders.gl/draco';
import path from 'path';
import {validateLoadedData} from 'test/common/conformance';

const BUNNY_DRC =
  readFileSync(path.resolve(__dirname, '../data/bunny.drc')) ||
  require('../data/bunny.drc');

test('DracoLoader#parse and encode', t => {
  const data = parseFileSync(BUNNY_DRC, DracoLoader);
  validateLoadedData(t, data);

  t.equal(getGLTFAttribute(data, 'POSITION').value.length, 104502, 'position attribute was found');

  t.end();
});

test('DracoWorkerLoader#parse', t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  // Once binary is transferred to worker it cannot be read from the main thread
  // Duplicate it here to avoid breaking other tests
  const bunnyBinary = BUNNY_DRC.slice();
  parseFile(bunnyBinary, DracoWorkerLoader).then(data => {
    validateLoadedData(t, data);

    t.equal(getGLTFAttribute(data, 'POSITION').value.length, 104502, 'position attribute was found');

  }).catch(error => {
    t.fail(error);

  }).then(t.end);
});
