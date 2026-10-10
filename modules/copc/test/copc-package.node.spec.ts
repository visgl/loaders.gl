// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {expect, test} from 'vitest';

test('COPC package is publishable and installed ESM/CJS entrypoints expose its writer', () => {
  const packageMetadata = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );
  expect(packageMetadata.private).not.toBe(true);
  expect(packageMetadata.publishConfig.access).toBe('public');
  for (const mode of ['module', 'commonjs']) {
    const script =
      mode === 'module'
        ? "import {COPCWriter, COPCSourceLoader} from '@loaders.gl/copc'; import {createCOPCConversionCodec} from '@loaders.gl/tile-converter/v5'; if (!COPCWriter.encodeSync || !createCOPCConversionCodec) throw Error('missing entrypoints'); process.stdout.write(COPCSourceLoader.version);"
        : "const {COPCWriter, COPCSourceLoader} = require('@loaders.gl/copc'); const {createCOPCConversionCodec} = require('@loaders.gl/tile-converter/v5'); if (!COPCWriter.encodeSync || !createCOPCConversionCodec) throw Error('missing entrypoints'); process.stdout.write(COPCSourceLoader.version);";
    expect(
      execFileSync(process.execPath, [`--input-type=${mode}`, '--eval', script], {
        cwd: process.cwd(),
        stdio: 'pipe',
        encoding: 'utf8'
      })
    ).toBe(packageMetadata.version);
  }
});
