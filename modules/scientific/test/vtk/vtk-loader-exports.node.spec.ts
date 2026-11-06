// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {expect, test} from 'vitest';

test('published VTK ESM parser and metadata preload resolve without source bundling', () => {
  const program = `
    import {VTKLoader} from '@loaders.gl/scientific';
    import {VTKLoaderWithParser} from '@loaders.gl/scientific/vtk-loader';
    const preloaded = await VTKLoader.preload();
    console.log(JSON.stringify({
      id: VTKLoaderWithParser.id,
      sameImplementation: preloaded === VTKLoaderWithParser,
      parseSync: typeof VTKLoaderWithParser.parseSync
    }));
  `;
  const output = execFileSync(process.execPath, ['--input-type=module', '--eval', program], {
    cwd: fileURLToPath(new URL('../../../../', import.meta.url)),
    encoding: 'utf8'
  });
  expect(JSON.parse(output)).toEqual({id: 'vtk', sameImplementation: true, parseSync: 'function'});
});
