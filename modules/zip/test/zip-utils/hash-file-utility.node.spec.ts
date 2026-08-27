// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import '@loaders.gl/polyfills';
import {expect, test} from 'vitest';
import {composeHashFile} from '../../src/hash-file-utility';
import {NodeFile} from '@loaders.gl/loader-utils';
import {makeZipCDHeaderIterator} from '../../src/parse-zip/cd-file-header';
const SLPKUrl = 'modules/i3s/test/data/DA12_subset.slpk';
test('zip#composeHashFile', async () => {
  expect((await composeHashFile(makeZipCDHeaderIterator(new NodeFile(SLPKUrl)))).byteLength).toBe(
    6888
  );
});
