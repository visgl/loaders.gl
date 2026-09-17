// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {build} from 'esbuild';
import {expect, test} from 'vitest';

test('Arrow tile source root import does not eagerly bundle the tiler implementation', async () => {
  const result = await build({
    stdin: {
      contents: "export {ArrowTableTileSourceLoader} from './modules/mvt/src/index.ts';",
      resolveDir: process.cwd(),
      sourcefile: 'arrow-table-tile-source-boundary.ts'
    },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    packages: 'external',
    // Leave the runtime subpath as a lazy import even when workspace aliases are active.
    external: ['@loaders.gl/mvt/arrow-table-tile-source-loader'],
    metafile: true,
    write: false
  });
  const output = result.outputFiles[0].text;
  const bundledInputs = Object.values(result.metafile.outputs).flatMap(output =>
    Object.keys(output.inputs)
  );
  expect(bundledInputs).toContain('modules/mvt/src/arrow-table-tile-source-loader-types.ts');
  expect(bundledInputs).not.toContain('modules/mvt/src/arrow-table-tile-source-loader.ts');
  expect(bundledInputs.some(filename => filename.includes('/vector-tiler/'))).toBe(false);
  expect(output).toContain('import("@loaders.gl/mvt/arrow-table-tile-source-loader")');
  expect(output).not.toContain('from "apache-arrow"');
  expect(output).not.toContain('from "@loaders.gl/gis"');
});
