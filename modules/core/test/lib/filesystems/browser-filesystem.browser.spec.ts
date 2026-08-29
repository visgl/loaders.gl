// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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

test('BrowserFileSystem supports ranges, case-insensitive lookup, metadata, and removal', async () => {
  const remoteFetch = async (url: string | URL | Request) => new Response(`remote:${String(url)}`);
  const remoteUrl = ['https:', '', 'example.test', 'file'].join('/');
  const file = new File(['abcdef'], 'Folder/Mixed.TXT', {type: 'text/plain'});
  const fileSystem = new BrowserFileSystem([file], {fetch: remoteFetch as typeof fetch});

  const rangedResponse = await fileSystem.fetch('folder/mixed.txt', {
    headers: {Range: 'bytes=1-3'}
  });
  expect(rangedResponse.status).toBe(206);
  expect(rangedResponse.headers.get('Content-Range')).toBe('bytes 1-3/6');
  expect(await rangedResponse.text()).toBe('bcd');
  expect((await fileSystem.fetch('Folder/Mixed.TXT')).url).toBe('Folder/Mixed.TXT');
  expect(await fileSystem.readdir('ignored')).toEqual(['Folder/Mixed.TXT']);
  expect(await fileSystem.stat('FOLDER/MIXED.TXT')).toEqual({size: 6});
  expect(fileSystem._getFile('folder/mixed.txt', true)).toBe(file);
  expect(await (await fileSystem.openReadableFile('FOLDER/MIXED.TXT', 'r')).read(0, 3)).toEqual(
    new TextEncoder().encode('abc').buffer
  );
  expect(await (await fileSystem.fetch(remoteUrl)).text()).toBe(`remote:${remoteUrl}`);

  await fileSystem.unlink('folder/mixed.txt');
  expect(await fileSystem.readdir()).toEqual([]);
  await expect(fileSystem.stat('Folder/Mixed.TXT')).rejects.toThrow('Folder/Mixed.TXT');
  expect((await fileSystem.fetch('Folder/Mixed.TXT')).ok).toBe(false);
  await fileSystem.unlink('missing.txt');
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
