// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {
  checkPublishedPackages,
  getPublishablePackages,
  waitForPublishedPackages
} from '../scripts/verify-published-packages.mjs';

const version = '5.0.0-beta.3';

test('release inventory includes public modules and the converter, excluding private workspaces', () => {
  const packages = getPublishablePackages(process.cwd());
  expect(packages.map(packageInfo => packageInfo.name)).toContain('@loaders.gl/documents');
  expect(packages.map(packageInfo => packageInfo.name)).toContain('@loaders.gl/tile-converter');
  expect(packages.map(packageInfo => packageInfo.name)).not.toContain('@loaders.gl/deck-layers');
  expect(new Set(packages.map(packageInfo => packageInfo.name)).size).toBe(packages.length);
});

test('publication verification requires both the version and its beta tag on every package', async () => {
  const packages = [
    {name: '@loaders.gl/core', version},
    {name: '@loaders.gl/documents', version},
    {name: '@loaders.gl/scene', version}
  ];
  const fetchMetadata = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify({versions: {[version]: {}}, 'dist-tags': {beta: version}}))
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({versions: {}, 'dist-tags': {beta: version}}))
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({versions: {[version]: {}}, 'dist-tags': {beta: '5.0.0-beta.2'}}))
    );
  const errors = await checkPublishedPackages(packages, version, 'beta', fetchMetadata);
  expect(errors).toEqual([
    '@loaders.gl/documents: release version is missing',
    '@loaders.gl/scene: distribution tag does not point at release'
  ]);
});

test('publication verification reports registry failures and inconsistent workspace versions', async () => {
  const packages = [
    {name: '@loaders.gl/core', version},
    {name: '@loaders.gl/documents', version},
    {name: '@loaders.gl/scene', version: '5.0.0-beta.2'}
  ];
  const fetchMetadata = vi
    .fn()
    .mockResolvedValueOnce(new Response('', {status: 404}))
    .mockRejectedValueOnce(new Error('registry unavailable'));
  const errors = await checkPublishedPackages(packages, version, 'beta', fetchMetadata);
  expect(errors).toHaveLength(3);
  expect(errors[0]).toContain('HTTP 404');
  expect(errors[1]).toContain('registry unavailable');
  expect(errors[2]).toContain('workspace version differs');
});

test('publication verification retries delayed metadata without repeating publication', async () => {
  const packages = [{name: '@loaders.gl/core', version}];
  const checkPackages = vi.fn().mockResolvedValueOnce(['version missing']).mockResolvedValue([]);
  const sleep = vi.fn().mockResolvedValue(undefined);
  const reportErrors = vi.fn();
  await expect(
    waitForPublishedPackages(packages, version, 'beta', {
      attempts: 3,
      intervalMilliseconds: 25,
      checkPackages,
      sleep,
      reportErrors
    })
  ).resolves.toEqual([]);
  expect(checkPackages).toHaveBeenCalledTimes(2);
  expect(checkPackages).toHaveBeenLastCalledWith(packages, version, 'beta');
  expect(sleep).toHaveBeenCalledExactlyOnceWith(25);
  expect(reportErrors).toHaveBeenCalledExactlyOnceWith(['version missing']);
});

test('publication verification fails after its bounded wait without a final sleep', async () => {
  const checkPackages = vi.fn().mockResolvedValue(['beta tag missing']);
  const sleep = vi.fn().mockResolvedValue(undefined);
  await expect(
    waitForPublishedPackages([], version, 'beta', {
      attempts: 3,
      checkPackages,
      sleep,
      reportErrors: vi.fn()
    })
  ).resolves.toEqual(['beta tag missing']);
  expect(checkPackages).toHaveBeenCalledTimes(3);
  expect(sleep).toHaveBeenCalledTimes(2);
});
