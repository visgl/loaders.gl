import {expect, test} from 'vitest';
import {fetchFile, _BrowserFileSystem as BrowserFileSystem} from '@loaders.gl/core';

export const IMAGE_URLS = [
  '@loaders.gl/images/test/data/img1-preview.png',
  '@loaders.gl/images/test/data/img1-preview.jpeg',
  '@loaders.gl/images/test/data/img1-preview.gif',
  '@loaders.gl/images/test/data/img1-preview.bmp'
];

test('BrowserFileSystem#fetch', async () => {
  const fileList = await loadImagesAsFiles();
  const fileSystem = new BrowserFileSystem(fileList);
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const {fetch} = fileSystem;

  for (const url of IMAGE_URLS) {
    const response = await fetch(url);
    expect(response.ok, `fetching file from browser file system: ${url}`).toBeTruthy();
  }

  const response = await fetch('bogus.txt');
  expect(response.ok, 'fetching non-existent file from browser file system fails').toBeFalsy();
});

const readFile = url => fetchFile(url).then(response => response.arrayBuffer());

let imagesPromise: Promise<File[]> | null = null;

/** Load fixture images as `File` instances. */
async function loadImagesAsFiles() {
  if (!imagesPromise) {
    imagesPromise = Promise.all(
      IMAGE_URLS.map(url => readFile(url).then(data => new File([data], url)))
    );
  }

  return await imagesPromise;
}
