// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {expect, test} from 'vitest';

test('retired sidebar aliases preserve legacy module redirects', () => {
  const aliases = JSON.parse(
    execFileSync(
      process.execPath,
      [
        '-e',
        `const configuration = require('./docusaurus.config.js');
const plugin = configuration.plugins.find(plugin => Array.isArray(plugin) && plugin[0] === '@docusaurus/plugin-client-redirects');
const redirect = plugin[1].createRedirects;
process.stdout.write(JSON.stringify({
  core: redirect('/docs/modules/core'),
  arrow: redirect('/docs/modules/tables/arrow'),
  guide: redirect('/docs/developer-guide/authentication')
}));`
      ],
      {cwd: fileURLToPath(new URL('../../website/', import.meta.url)), encoding: 'utf8'}
    )
  );

  expect(aliases.core).toEqual(
    expect.arrayContaining(['/modules/core', '/docs/modules/_sections/core/root-api'])
  );
  expect(aliases.arrow).toEqual(
    expect.arrayContaining(['/docs/modules/arrow', '/docs/modules/_sections/tables/api-arrow'])
  );
  expect(aliases.guide).toContain('/docs/modules/_sections/services/guides');
});
