
/* eslint-disable max-len */
import test from 'tape-catch';
import {encodeFile, parseFile} from '@loaders.gl/core';
import {ZipWriter, ZipLoader} from '@loaders.gl/zip';

const FILE_MAP = {
  src: 'abc',
  dist: 'cba',
  'README.md': 'This is a module',
  package: '{"name": "module"}'
};

test('Zip#encode/decode', t => {
  encodeFile(FILE_MAP, ZipWriter)
    .then(arrayBuffer => parseFile(arrayBuffer, ZipLoader))
    .then(fileMap => {
      for (const key in FILE_MAP) {
        t.equal(FILE_MAP[key], fileMap[key], `Subfile ${key} encoded/decoded correctly`);
      }
      t.end();
    })
    .catch(error => {
      t.fail(error.message);
      t.end();
    });
});
