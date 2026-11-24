// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
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

test('module API navigation uses published entrypoints with clickable main pages', () => {
  const sidebar = JSON.parse(readFileSync('docs/docs-sidebar.json', 'utf8'));
  const documents = new Set<string>();
  /** Validates named sections against the owning package's public export map. */
  function visit(items: any[], parentLabel?: string) {
    for (const item of items) {
      const document =
        typeof item === 'string'
          ? item
          : item.id || (item.link?.type === 'doc' ? item.link.id : undefined);
      if (document) {
        expect(documents.has(document), document + ' has one sidebar owner').toBe(false);
        documents.add(document);
      }
      if (typeof item !== 'object') continue;
      expect(item.label).not.toBe('API');
      if (item.label?.startsWith('@loaders.gl/')) {
        const [, owner, ...subpath] = item.label.split('/');
        const manifest = JSON.parse(
          readFileSync(
            owner === 'tile-converter'
              ? 'apps/tile-converter/package.json'
              : `modules/${owner}/package.json`,
            'utf8'
          )
        );
        expect(manifest.exports, item.label).toHaveProperty(
          subpath.length ? './' + subpath.join('/') : '.'
        );
        expect(item.id || (item.link?.type === 'doc' && item.link.id), item.label).toBeTruthy();
        expect(item.label).not.toBe(parentLabel);
      }
      if (item.items) visit(item.items, item.label);
    }
  }
  visit(sidebar);
});
