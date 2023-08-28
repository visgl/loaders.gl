import test from 'tape-promise/tape';
import {validateLoader, validateWriter} from 'test/common/conformance';

import {ZipWriter, ZipLoader} from '@loaders.gl/zip';
import {encode, load, parse} from '@loaders.gl/core';
import {getFileProvider} from './test-utils/get-file-provider';
import {ZipFileSystem} from '../src/filesystems/zip-filesystem';

const FILE_MAP = {
  src: 'abc',
  dist: 'cba',
  'README.md': 'This is a module',
  package: '{"name": "module"}'
};

const ZIP_FILE_PATH = './modules/zip/test/data/test-store.zip';

test('Zip#loader/writer conformance', (t) => {
  validateLoader(t, ZipLoader, 'ZipLoader');
  validateWriter(t, ZipWriter, 'ZipWriter');
  t.end();
});

test('Zip#encode/decode', (t) => {
  encode(FILE_MAP, ZipWriter)
    .then((arrayBuffer) => parse(arrayBuffer, ZipLoader))
    .then((fileMap) => {
      for (const key in FILE_MAP) {
        const text = new TextDecoder().decode(fileMap[key]);
        t.equal(text, FILE_MAP[key], `Subfile ${key} encoded/decoded correctly`);
      }
      t.end();
    })
    .catch((error) => {
      t.fail(error.message);
      t.end();
    });
});

test('Zip#load one file', async (t) => {
  const fileProvider = await getFileProvider(ZIP_FILE_PATH);
  const fileSystem = new ZipFileSystem(fileProvider);
  const result = await load('test-file.txt', ZipLoader, {
    fetch: fileSystem.fetch.bind(fileSystem),
    zip: {mode: 'one'}
  });
  if (result instanceof ArrayBuffer) {
    const text = new TextDecoder().decode(result);
    t.equal(text, 'test file data\n');
  }
  t.end();
});
