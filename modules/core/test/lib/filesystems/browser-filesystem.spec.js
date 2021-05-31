import test from 'tape-promise/tape';
import {fetchFile, isBrowser} from '@loaders.gl/core';
import {_BrowserFileSystem as BrowserFileSystem} from '@loaders.gl/core';

const IMAGE_URLS = [
  '@loaders.gl/images/test/data/img1-preview.png',
  '@loaders.gl/images/test/data/img1-preview.jpeg',
  '@loaders.gl/images/test/data/img1-preview.gif',
  '@loaders.gl/images/test/data/img1-preview.bmp'
];

test('BrowserFileSystem#fetch', async t => {
  if (isBrowser) {
    const fileList = await loadImagesAsFiles();
    const fileSystem = new BrowserFileSystem(fileList);
    const {fetch} = fileSystem;
    for (const url of IMAGE_URLS) {
      const response = await fetch(url);
      t.ok(response.ok, `fetching file from browser file system: ${url}`);
    }

    const response = await fetch('bogus.txt');
    t.notOk(response.ok, `fetching non-existent file from browser file system fails`);
  }
  t.end();
});

// HELPER

const readFile = url => fetchFile(url).then(response => response.arrayBuffer());

let imagesPromise = null;

/**
 * @returns {Promise<File[]>}
 */
async function loadImagesAsFiles() {
  if (!imagesPromise) {
    imagesPromise = Promise.all(
      IMAGE_URLS.map(url => readFile(url).then(data => new File([data], url)))
    );
  }
  return await imagesPromise;
}
