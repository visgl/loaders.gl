// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {I3SLoader} from '@loaders.gl/i3s';
import {I3SArchiveSource, I3SSource, Tiles3DArchiveSource, Tiles3DSource} from '@loaders.gl/tiles';
import {createSource} from '@loaders.gl/deck-layers';

test('createSource#selects Tiles3DArchiveSource for 3tz urls', t => {
  const source = createSource('https://example.com/data/test.3tz', Tiles3DLoader, {});
  t.ok(source instanceof Tiles3DArchiveSource);
  t.end();
});

test('createSource#selects I3SArchiveSource for slpk urls', t => {
  const source = createSource('https://example.com/data/test.slpk', I3SLoader, {});
  t.ok(source instanceof I3SArchiveSource);
  t.end();
});

test('createSource#keeps non-archive loaders on standard source classes', t => {
  const tiles3DSource = createSource('https://example.com/data/tileset.json', Tiles3DLoader, {});
  const i3sSource = createSource('https://example.com/data/layers/0', I3SLoader, {});

  t.ok(tiles3DSource instanceof Tiles3DSource);
  t.ok(i3sSource instanceof I3SSource);
  t.end();
});
