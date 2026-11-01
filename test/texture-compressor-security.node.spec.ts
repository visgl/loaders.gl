// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createRequire} from 'node:module';
import {expect, test} from 'vitest';

const require = createRequire(import.meta.url);
const {getImageSize} = require('texture-compressor/dist/cli/lib/utilities.js');

test('legacy texture compressor reads dimensions with the updated image-size API', () => {
  const png = getImageSize('modules/images/test/data/ibl/brdfLUT.png');
  const jpeg = getImageSize(
    'modules/images/test/data/ibl/papermill/environment/environment_right_0.jpg'
  );
  expect(png.width).toBeGreaterThan(0);
  expect(png.height).toBeGreaterThan(0);
  expect(jpeg.width).toBeGreaterThan(0);
  expect(jpeg.height).toBeGreaterThan(0);
});

test('legacy compressor rejects an ICNS entry with zero length without hanging', () => {
  const {mkdtempSync, writeFileSync, rmSync} = require('node:fs');
  const {tmpdir} = require('node:os');
  const {join} = require('node:path');
  const {spawnSync} = require('node:child_process');
  const directory = mkdtempSync(join(tmpdir(), 'texture-icns-'));
  try {
    const file = join(directory, 'malformed.icns');
    const bytes = Buffer.alloc(16);
    bytes.write('icns', 0);
    bytes.writeUInt32BE(bytes.length, 4);
    bytes.write('ic07', 8);
    writeFileSync(file, bytes);
    const result = spawnSync(
      process.execPath,
      [
        '-e',
        `require('node:fs').accessSync(process.argv[1]); try { require('texture-compressor/dist/cli/lib/utilities.js').getImageSize(process.argv[1]); process.exit(1); } catch { process.exit(0); }`,
        file
      ],
      {timeout: 5000}
    );
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});
