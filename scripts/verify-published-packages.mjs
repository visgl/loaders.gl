#!/usr/bin/env node
// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/** Lists the public workspace packages that the fixed-version release publishes. */
export function getPublishablePackages(rootDirectory) {
  return ['modules', 'apps'].flatMap(directory =>
    fs.readdirSync(path.join(rootDirectory, directory), {withFileTypes: true}).flatMap(entry => {
      const manifestPath = path.join(rootDirectory, directory, entry.name, 'package.json');
      if (!entry.isDirectory() || !fs.existsSync(manifestPath)) return [];
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      return manifest.private ? [] : [{name: manifest.name, version: manifest.version}];
    })
  );
}

/** Checks every public version and distribution tag; registry lag and request errors remain retryable. */
export async function checkPublishedPackages(
  packages,
  version,
  distributionTag,
  fetchMetadata = fetch
) {
  const results = await Promise.all(
    packages.map(async packageInfo => {
      if (packageInfo.version !== version)
        return packageInfo.name + ': workspace version differs from release';
      try {
        const response = await fetchMetadata(
          'https://registry.npmjs.org/' + encodeURIComponent(packageInfo.name),
          {
            headers: {Accept: 'application/vnd.npm.install-v1+json'},
            signal: AbortSignal.timeout(15_000)
          }
        );
        if (!response.ok) return packageInfo.name + ': registry HTTP ' + response.status;
        const metadata = await response.json();
        if (!metadata.versions?.[version]) return packageInfo.name + ': release version is missing';
        if (metadata['dist-tags']?.[distributionTag] !== version)
          return packageInfo.name + ': distribution tag does not point at release';
        return null;
      } catch (error) {
        return packageInfo.name + ': ' + String(error);
      }
    })
  );
  return results.filter(Boolean);
}

/** Waits for public registry propagation; returns the final errors without weakening verification. */
export async function waitForPublishedPackages(
  packages,
  version,
  distributionTag,
  {
    attempts = 60,
    intervalMilliseconds = 15_000,
    checkPackages = checkPublishedPackages,
    sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)),
    reportErrors = errors => console.error(errors.join('\n'))
  } = {}
) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const errors = await checkPackages(packages, version, distributionTag);
    if (!errors.length) {
      console.log(
        'Verified ' +
          packages.length +
          ' npm packages at ' +
          version +
          ' with tag ' +
          distributionTag
      );
      return [];
    }
    reportErrors(errors);
    if (attempt === attempts - 1) return errors;
    await sleep(intervalMilliseconds);
  }
  throw new Error('Publication verification requires at least one attempt');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const version = JSON.parse(fs.readFileSync('lerna.json', 'utf8')).version;
  const distributionTag = process.argv[2] || (version.includes('-') ? 'beta' : 'latest');
  const packages = getPublishablePackages(process.cwd());
  if (!packages.length) throw new Error('No public workspace packages found');
  const errors = await waitForPublishedPackages(packages, version, distributionTag);
  if (errors.length) process.exitCode = 1;
}
