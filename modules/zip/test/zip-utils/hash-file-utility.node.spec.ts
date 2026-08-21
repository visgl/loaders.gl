// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import '@loaders.gl/polyfills';
import test from 'test/utils/vitest-tape';
import {composeHashFile} from '../../src/hash-file-utility';
import {NodeFile} from '@loaders.gl/loader-utils';
import {makeZipCDHeaderIterator} from '../../src/parse-zip/cd-file-header';

const SLPKUrl = 'modules/i3s/test/data/DA12_subset.slpk';

test('zip#composeHashFile', async t => {
  t.equal((await composeHashFile(makeZipCDHeaderIterator(new NodeFile(SLPKUrl)))).byteLength, 6888);
});
