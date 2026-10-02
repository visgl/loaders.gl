// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {join} from 'node:path';
import tileConverterPackage from '../apps/tile-converter/package.json';
import {ChildProcessProxy} from '@loaders.gl/worker-utils';
import {load, fetchFile} from '@loaders.gl/core';
import {writeFile} from '../apps/tile-converter/src/v4/lib/utils/file-utils';
import {DepsInstaller} from '../apps/tile-converter/src/v4/deps-installer/deps-installer';

vi.mock('@loaders.gl/core', () => ({load: vi.fn(), fetchFile: vi.fn()}));
vi.mock('../apps/tile-converter/src/v4/lib/utils/file-utils', () => ({writeFile: vi.fn()}));

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

test.each([
  ['i3s', 'i3s-content-worker-node.js', ''],
  ['draco', 'draco-writer-worker-node.cjs', ''],
  ['textures', 'basis-worker-node.cjs', ''],
  ['textures', 'basis_encoder.wasm', 'libs']
])('dependency installer downloads %s/%s without empty URL segments', async (moduleName, fileName, extraPath) => {
  const fileData = new Uint8Array([1, 2, 3]).buffer;
  vi.mocked(fetchFile).mockResolvedValue(new Response(fileData));
  await new DepsInstaller()['installFromNpm'](moduleName, fileName, extraPath);
  const resourcePath = extraPath ? `dist/${extraPath}/${fileName}` : `dist/${fileName}`;
  expect(fetchFile).toHaveBeenCalledWith(
    `https://unpkg.com/@loaders.gl/${moduleName}@${tileConverterPackage.version}/${resourcePath}`
  );
  expect(writeFile).toHaveBeenCalledWith(
    join(process.cwd(), 'modules', moduleName, 'dist', extraPath),
    fileData,
    fileName
  );
});

test('dependency installer reports the failing URL and HTTP status without writing an error body', async () => {
  vi.mocked(fetchFile).mockResolvedValue(new Response('missing', {status: 404}));
  await expect(
    new DepsInstaller()['installFromNpm']('i3s', 'i3s-content-worker-node.js')
  ).rejects.toThrow(
    `Failed to load resource i3s-content-worker-node.js from https://unpkg.com/@loaders.gl/i3s@${tileConverterPackage.version}/dist/i3s-content-worker-node.js: HTTP 404`
  );
  expect(writeFile).not.toHaveBeenCalled();
});

test('full dependency installation requests published workers and installs the Draco writer into its runtime fallback directory', async () => {
  vi.mocked(load).mockResolvedValue({'geoids/egm2008-5.pgm': new ArrayBuffer(1)});
  vi.mocked(fetchFile).mockImplementation(async () => new Response(new Uint8Array([1, 2, 3])));
  vi.spyOn(ChildProcessProxy.prototype, 'start').mockResolvedValue(undefined);
  await new DepsInstaller().install('deps');
  const requestedUrls = vi.mocked(fetchFile).mock.calls.map(([url]) => String(url));
  expect(requestedUrls.filter(url => url.includes('worker-node'))).toEqual([
    `https://unpkg.com/@loaders.gl/i3s@${tileConverterPackage.version}/dist/i3s-content-worker-node.js`,
    `https://unpkg.com/@loaders.gl/draco@${tileConverterPackage.version}/dist/draco-worker-node.js`,
    `https://unpkg.com/@loaders.gl/draco@${tileConverterPackage.version}/dist/draco-writer-worker-node.cjs`,
    `https://unpkg.com/@loaders.gl/textures@${tileConverterPackage.version}/dist/basis-worker-node.cjs`,
    `https://unpkg.com/@loaders.gl/textures@${tileConverterPackage.version}/dist/ktx2-basis-writer-worker-node.cjs`
  ]);
  expect(writeFile).toHaveBeenCalledWith(
    join(process.cwd(), 'modules', 'draco', 'dist'),
    expect.any(ArrayBuffer),
    'draco-writer-worker-node.cjs'
  );
});
