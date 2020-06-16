/* global process */
import test from 'tape-promise/tape';
import ZipReadableFilesystem from '@loaders.gl/zip/lib/zip-stream/zip-readable-filesystem';
import extractZip from '@loaders.gl/zip/lib/zip-stream/extract-zip';

import fs from 'fs';
import path from 'path';
import {PassThrough} from 'stream';

const DATA_DIR = `${__dirname}/../../data`;
const BASE_PATH_TMP = `${DATA_DIR}/.tmp/`;
// const contentPath = `${DATA_DIR}/content/`;

let testPathTmp;
let testNum = 0;

function setupFixture() {
  // setup, create a temp directory

  testPathTmp = `${BASE_PATH_TMP + testNum++}/`;
  if (!fs.existsSync(BASE_PATH_TMP)) fs.mkdirSync(BASE_PATH_TMP);
  if (fs.existsSync(testPathTmp)) rmdirSync(testPathTmp);
  fs.mkdirSync(testPathTmp);

  // teardown, destroy temp directory
  process.on('exit', function() {
    rmdirSync(BASE_PATH_TMP);
  });
}

setupFixture();

// ZipReadFS test cases

test('ZipReadableFileSystem#tiny.zip', async t => {
  debugger
  const zip = new ZipReadableFilesystem(`${DATA_DIR}/special/tiny.zip`);
  const filenames = await zip.readdir();
  t.comment(filenames.join(', '));
  const actualEntryData = await zip.readFile('BSDmakefile');
  t.equal(actualEntryData.toString('utf8').substr(0, 4), 'all:', 'Correctly read data of an entry');
  t.end();
});

test.skip('ZipReadableFileSystem#zip64.zip', async t => {
  t.plan(1);
  const zip = new ZipReadableFilesystem(`${DATA_DIR}/special/zip64.zip`);
  const internalZip = await zip.readFile('files.zip');

  // Extract embedded Zip
  const filesZipTmp = `${BASE_PATH_TMP}files.zip`;
  fs.writeFileSync(filesZipTmp, internalZip);

  const filesZip = new ZipReadableFilesystem(filesZipTmp);
  const filenames = await filesZip.readdir();
  t.equal(filenames.length, 66667, 'Should have correct number of files');
  t.end();
});

test('ZipReadableFileSystem#openEntry', async t => {
  const zip = new ZipReadableFilesystem(`${DATA_DIR}/ok/normal.zip`);
  const entries = await zip.entries();
  const entry = entries['doc/changelog-foot.html'];
  t.ok(entry);
  const entryBeforeOpen = {...entry};
  // @ts-ignore
  const entryAfterOpen = await zip._openEntry(entry);
  t.notDeepEqual(entryBeforeOpen, entryAfterOpen);
  t.end();
});

// ERROR

// TODO works but hangs tests
test.skip('ZipReadableFileSystem#error#enc_aes.zip', async t => {
  const zip = new ZipReadableFilesystem(`${DATA_DIR}/err/enc_aes.zip`);
  await t.rejects(
    zip.readFile('README.md'),
    /Entry encrypted/,
    'Should error when reading AES encrypted entry'
  );
  t.comment('ending');
  t.end();
});

test('ZipReadableFileSystem#error#enc_zipcrypto.zip', async t => {
  const zip = new ZipReadableFilesystem(`${DATA_DIR}/err/enc_zipcrypto.zip`);
  await t.rejects(
    zip.readFile('README.md'),
    /Entry encrypted/,
    'Should error when reading encrypted entry'
  );
  t.end();
});

test('ZipReadableFileSystem#error#lzma.zip', async t => {
  const zip = new ZipReadableFilesystem(`${DATA_DIR}/err/lzma.zip`);
  await t.rejects(
    zip.readFile('README.md'),
    /Unknown compression method: 14/,
    'Should error when unknown compression'
  );
  t.end();
});

test('ZipReadableFileSystem#error#rar.rar', async t => {
  const zip = new ZipReadableFilesystem(`${DATA_DIR}/err/rar.rar`);
  await t.rejects(zip.readFile('README.md'), /Bad archive/, 'Should error when non zip archive');
  t.end();
});

test('ZipReadableFileSystem#error#evil.zip', async t => {
  const zip = new ZipReadableFilesystem(`${DATA_DIR}/err/evil.zip`);
  const entryName = '..\\..\\..\\..\\..\\..\\..\\..\\file.txt';
  await t.rejects(zip.deviceInfo(), /Malicious entry: / /* ' + entryName */);

  const zip2 = new ZipReadableFilesystem(`${DATA_DIR}/err/evil.zip`, {
    skipEntryNameValidation: true
  });
  await t.doesNotReject(zip2.entry(entryName), 'Entry exists');

  t.end();
});

test('ZipReadableFileSystem#error#zip does not exist', async t => {
  const zip = new ZipReadableFilesystem(`${DATA_DIR}/err/doesnotexist.zip`);
  await t.rejects(zip.deviceInfo(), /ENOENT: no such file or directory/);
  await t.doesNotReject(zip.close(), 'zip.close() should not reject');
  t.end();
});

test('ZipReadableFileSystem#error#deflate64.zip', async t => {
  const zip = new ZipReadableFilesystem(`${DATA_DIR}/err/deflate64.zip`);
  await t.rejects(zip.stream('README.md'), /Unknown compression method: 9/);
  t.end();
});

test.skip('ZipReadableFileSystem#stream exception', async t => {
  const zip = new ZipReadableFilesystem(`${DATA_DIR}/special/tiny.zip`);

  const stream = await zip.stream('BSDmakefile');

  let callbackCallCount = 0;
  const streamPromise = new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  stream.on('data', function() {
    callbackCallCount++;
    throw new Error('descriptive message!');
  });

  const downstream = new PassThrough();
  stream.pipe(downstream);

  await t.rejects(streamPromise, /descriptive message/);
  t.equal(callbackCallCount, 1);
  t.end();
});

// EXTRACT

test('ZipReadableFileSystem#test files', async t => {
  let filesOk = fs.readdirSync(`${DATA_DIR}/ok`);
  filesOk = filesOk.filter(file => file !== 'osx.zip'); // TODO
  await Promise.all(filesOk.map(file => extractAndValidate(file, t)));
  t.end();
});

test('ZipReadableFileSystem#error#corrupt_entry.zip', async t => {
  const zip = new ZipReadableFilesystem(`${DATA_DIR}/err/corrupt_entry.zip`);
  await t.rejects(extractZip(zip, 'doc/api_assets/logo.svg', testPathTmp));
  await t.rejects(extractZip(zip, '', testPathTmp));
});

test('ZipReadableFileSystem#error#bad_crc.zip', async t => {
  const zip = new ZipReadableFilesystem(`${DATA_DIR}/err/bad_crc.zip`);
  // await t.rejects(extractZip(zip, 'doc/api_assets/logo.svg', testPathTmp), /Invalid CRC/);
  await t.rejects(extractZip(zip, '', testPathTmp));
  t.end();
});

/*
test.skip('ZipReadableFileSystem#parallel#streaming 100 files', t => {
  var num = 100;
  t.plan(num);
  const zip = new ZipReadableFilesystem(`${DATA_DIR}/ok/normal.zip`);
  var extracted = 0;
  var files = ['doc/changelog-foot.html', 'doc/sh_javascript.min.js', 'BSDmakefile', 'README.md'];
  for (var i = 0; i < num; i++) {
    var file = files[Math.floor(Math.random() * files.length)];
    extractZip(zip, file, testPathTmp + i, function (err) {
      t.notOk(err);
      if (++extracted === num)
        t.end();
    });
  }
});
*/

async function extractAndValidate(file, t) {
  let expEntriesCount = 10;
  // let expEntriesCountInDocDir = 4;
  if (file === 'osx.zip') {
    expEntriesCount = 25;
    // expEntriesCountInDocDir = 5;
  } else if (file === 'windows.zip') {
    expEntriesCount = 8;
  }
  // t.plan(23);
  const zip = new ZipReadableFilesystem(`${DATA_DIR}/ok/${file}`);
  const files = await zip.readdir();
  t.equal(files.length, expEntriesCount, `should match #entries in ${file}`);
  const entries = await zip.entries();

  const containsAll = [
    'BSDmakefile',
    'README.md',
    'doc/api_assets/logo.svg',
    'doc/api_assets/sh.css',
    'doc/changelog-foot.html',
    'doc/sh_javascript.min.js'
  ].every(function(expFile) {
    return entries[expFile];
  });
  t.ok(containsAll);

  t.ok(!(await zip.entry('not-existing-file')));

  const entry = await zip.entry('BSDmakefile');
  t.ok(entry);
  t.ok(!entry.isDirectory);
  t.ok(entry.isFile);

  const dirEntry = await zip.entry('doc/');
  const dirShouldExist = file !== 'windows.zip'; // windows archives can contain not all directories
  t.ok(!dirShouldExist || dirEntry);
  t.ok(!dirShouldExist || dirEntry.isDirectory);
  t.ok(!dirShouldExist || !dirEntry.isFile);

  /*
  var filePromise = new Promise(function(resolve) {
    extractZip(zip, 'README.md', testPathTmp + 'README.md', (err, res) => {
      t.notOk(err);
      t.ok(1, res);
      assertFilesEqual(t, contentPath + 'README.md', testPathTmp + 'README.md');
      resolve();
    });
  });
  var fileToFolderPromise = new Promise(function(resolve) {
    extractZip(zip, 'README.md', testPathTmp, (err, res) => {
      t.notOk(err);
      t.ok(1, res);
      assertFilesEqual(t, contentPath + 'README.md', testPathTmp + 'README.md');
      resolve();
    });
  });
  var folderPromise = new Promise(function(resolve) {
    extractZip(zip, 'doc/', testPathTmp, (err, res) => {
      t.notOk(err);
      t.equal(res, expEntriesCountInDocDir);
      assertFilesEqual(t, contentPath + 'doc/api_assets/sh.css', testPathTmp + 'api_assets/sh.css');
      resolve();
    });
  });
  var extractAllPromise = new Promise(function(resolve) {
    extractZip(zip, null, testPathTmp, (err, res) => {
      t.notOk(err);
      t.ok(7, res);
      assertFilesEqual(t, contentPath + 'doc/api_assets/sh.css', testPathTmp + 'doc/api_assets/sh.css');
      assertFilesEqual(t, contentPath + 'BSDmakefile', testPathTmp + 'BSDmakefile');
      resolve();
    });
  });
  var actualEentryData = zip.entryDataSync('README.md');
  var expectedEntryData = fs.readFileSync(contentPath + 'README.md');
  assertBuffersEqual(t, actualEentryData, expectedEntryData, `sync entry ${file}`);
  await Promise.all([filePromise, fileToFolderPromise, folderPromise, extractAllPromise]);
  */
  t.end();
}

// HELPERS

// function assertFilesEqual(t, actual, expected) {
//   assertBuffersEqual(
//     t,
//     fs.readFileSync(actual),
//     fs.readFileSync(expected),
//     `${actual  } <> ${  expected}`
//   );
// }

// function assertBuffersEqual(t, actual, expected, str) {
//   const actualData = actual.toString('utf8').replace(/\r\n/g, '\n');
//   const expectedData = expected.toString('utf8').replace(/\r\n/g, '\n');
//   t.equals(actualData, expectedData, str);
// }

function rmdirSync(dir) {
  const list = fs.readdirSync(dir);
  for (let i = 0; i < list.length; i++) {
    const filename = path.join(dir, list[i]);
    const stat = fs.statSync(filename);

    const isDir = filename === '.' || filename === '..';
    if (!isDir && stat.isDirectory()) {
      rmdirSync(filename);
    } else {
      try {
        fs.unlinkSync(filename);
      } catch (e) {
        // ignore
      }
    }
  }
  try {
    fs.rmdirSync(dir);
  } catch (e) {
    // ignore
  }
}
