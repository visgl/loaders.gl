#!/usr/bin/env node
// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

/** Audits public paths and keeps benchmark implementations outside production packages. */
export function auditPublicImports() {
  const violations = [];
  const filenames = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    encoding: 'utf8'
  }).trim().split('\n');
  for (const filename of new Set(filenames)) {
    if (!fs.existsSync(filename)) continue;
    if (/^modules\/[^/]+\/package\.json$/.test(filename)) {
      const manifest = JSON.parse(fs.readFileSync(filename, 'utf8'));
      for (const subpath of Object.keys(manifest.exports || {})) {
        if (/\/index$/.test(subpath) || (manifest.name !== '@loaders.gl/core' && !path.extname(subpath) && /^\.\/([^/]+)\/\1(?:-|$)/.test(subpath))) {
          violations.push(`${filename}: redundant public export ${subpath}`);
        }
      }
    }
    if (!/\.(?:[cm]?[jt]sx?|mdx?)$/.test(filename)) continue;
    const contents = fs.readFileSync(filename, 'utf8');
    // Migration prose may name removed paths, but executable imports and examples may not use them.
    const imports = contents.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"](@loaders\.gl\/[^'"\s]+)['"]/g);
    for (const [, specifier] of imports) {
      const subpath = specifier.replace(/^@loaders\.gl\/[^/]+/, '');
      if (/\/index(?:\.[cm]?js)?$/.test(subpath) || (!specifier.startsWith('@loaders.gl/core/') && !path.extname(subpath) && /^\/([^/]+)\/\1(?:-|$)/.test(subpath))) {
        violations.push(`${filename}: redundant public import ${specifier}`);
      }
    }
    if (/^modules\/[^/]+\/src\//.test(filename) && /alternate-loaders/.test(contents)) {
      violations.push(`${filename}: production code references website comparison support`);
    }
  }
  return violations;
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const violations = auditPublicImports();
  if (violations.length) {
    console.error(violations.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('Public import and production implementation boundaries passed.');
  }
}
