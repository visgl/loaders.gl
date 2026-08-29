// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {load, parse} from '@loaders.gl/core';
import {TOMLLoader as BundledTOMLLoader} from '@loaders.gl/config/bundled';
import {TOMLLoader as UnbundledTOMLLoader} from '@loaders.gl/config/unbundled';
import {TOMLFormat, TOMLLoader} from '@loaders.gl/config';

const TOML_TEXT = `
title = "TOML Example"

[owner]
name = "Tom Preston-Werner"
organization = "GitHub"

[database]
ports = [8001, 8001, 8002]
enabled = true
`;

test('TOMLLoader exposes format metadata', () => {
  expect(TOMLLoader).toMatchObject(TOMLFormat);
  expect(TOMLLoader.extensions).toEqual(['toml']);
  expect(TOMLLoader.mimeTypes).toContain('application/toml');
});

test('bundled TOMLLoader parses text synchronously', () => {
  const value = BundledTOMLLoader.parseTextSync?.(TOML_TEXT) as {
    title: string;
    owner: {name: string; organization: string};
    database: {ports: number[]; enabled: boolean};
  };

  expect(value).toEqual({
    title: 'TOML Example',
    owner: {name: 'Tom Preston-Werner', organization: 'GitHub'},
    database: {ports: [8001, 8001, 8002], enabled: true}
  });
});

test('bundled TOMLLoader parses ArrayBuffers asynchronously', async () => {
  const value = await BundledTOMLLoader.parse?.(new TextEncoder().encode('answer = 42').buffer);
  expect(value).toEqual({answer: 42});
});

test('unbundled TOMLLoader preloads its parser', async () => {
  expect('parse' in UnbundledTOMLLoader).toBe(false);

  const value = await parse('name = "loaders.gl"', UnbundledTOMLLoader);
  expect(value).toEqual({name: 'loaders.gl'});
});

test('TOMLLoader forwards parser options', async () => {
  const value = await load(
    new TextEncoder().encode('large = 9007199254740993').buffer,
    TOMLLoader,
    {
      toml: {integersAsBigInt: true}
    }
  );
  expect(value).toEqual({large: 9007199254740993n});
});
