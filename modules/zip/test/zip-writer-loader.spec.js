import test from 'tape-promise/tape';
import {encode, parse, TextDecoder} from '@loaders.gl/core';
import {ZipWriter, ZipLoader} from '@loaders.gl/zip';

const FILE_MAP = {
  src: 'abc',
  dist: 'cba',
  'README.md': 'This is a module',
  package: '{"name": "module"}'
};

test('Zip#encode/decode', t => {
  encode(FILE_MAP, ZipWriter)
    .then(arrayBuffer => parse(arrayBuffer, ZipLoader))
    .then(fileMap => {
      for (const key in FILE_MAP) {
        const text = new TextDecoder().decode(fileMap[key]);
        t.equal(text, FILE_MAP[key], `Subfile ${key} encoded/decoded correctly`);
      }
      t.end();
    })
    .catch(error => {
      t.fail(error.message);
      t.end();
    });
});
