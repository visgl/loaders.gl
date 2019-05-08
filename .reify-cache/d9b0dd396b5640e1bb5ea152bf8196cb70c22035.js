"use strict";var module1=module;var test;module1.link('tape-promise/tape',{default(v){test=v}},0);var encode,parse,TextDecoder;module1.link('@loaders.gl/core',{encode(v){encode=v},parse(v){parse=v},TextDecoder(v){TextDecoder=v}},1);var ZipWriter,ZipLoader;module1.link('@loaders.gl/zip',{ZipWriter(v){ZipWriter=v},ZipLoader(v){ZipLoader=v}},2);



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
