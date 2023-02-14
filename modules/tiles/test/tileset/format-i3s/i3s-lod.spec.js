import test from 'tape-promise/tape';
import {WebMercatorViewport} from '@deck.gl/core';
import {TILESET_STUB} from '@loaders.gl/i3s/test/test-utils/load-utils';
import {getFrameState, Tile3D, Tileset3D, getLodStatus} from '@loaders.gl/tiles';
import {
  getBigLodMetricTileHeader,
  getNextAfterRootTileHeader,
  getTileHeader,
  ROOT_TILE_HEADER
} from '../../data/tile-header-examples';
import {
  VIEWPORT_DEFAULT,
  VIEWPORT_NEW_YORK_OPTS,
  VIEWPORT_ROTATED_OPTS,
  VIEWPORT_ZOOM_OPTS,
  VIEWPORT_ZOOM_OUT_OPTS
} from '../../data/viewport-opts-examples';

test('I3S LOD#lodJudge - should return "DIG" if lodMetric is 0 or NaN', (t) => {
  const tilesetHeader = TILESET_STUB();
  tilesetHeader.root = ROOT_TILE_HEADER;
  const tileset = new Tileset3D(tilesetHeader);
  const viewport = new WebMercatorViewport(VIEWPORT_DEFAULT);
  const frameState = getFrameState(viewport, 1);

  if (tileset.root) {
    const lodResult = getLodStatus(tileset.root, frameState);
    t.equal(lodResult, 'DIG');
  }

  const tileHeader = getTileHeader();
  tileHeader.lodMetricValue = NaN;
  const tile2 = new Tile3D(tileset, tileHeader);
  const lodResult2 = getLodStatus(tile2, frameState);
  t.equal(lodResult2, 'DIG');

  t.end();
});

test('I3S LOD#lodJudge - should return "DRAW" if tile size projected on the screen plane less then LOD metric value', (t) => {
  const tilesetHeader = TILESET_STUB();
  tilesetHeader.root = ROOT_TILE_HEADER;
  const tileset = new Tileset3D(tilesetHeader);
  const viewport = new WebMercatorViewport(VIEWPORT_DEFAULT);
  const frameState = getFrameState(viewport, 1);

  const tileHeader = getTileHeader();
  const tile2 = new Tile3D(tileset, tileHeader);
  const lodResult2 = getLodStatus(tile2, frameState);
  t.equal(lodResult2, 'DRAW');

  t.end();
});

test('I3S LOD#lodJudge - should return "DIG" when zoom in', (t) => {
  const tilesetHeader = TILESET_STUB();
  tilesetHeader.root = ROOT_TILE_HEADER;
  const tileset = new Tileset3D(tilesetHeader);
  const viewport = new WebMercatorViewport(VIEWPORT_ZOOM_OPTS);
  const frameState = getFrameState(viewport, 1);

  const tileHeader = getTileHeader();
  const tile2 = new Tile3D(tileset, tileHeader);
  const lodResult2 = getLodStatus(tile2, frameState);
  t.equal(lodResult2, 'DIG');

  t.end();
});

test('I3S LOD#lodJudge - should return "DRAW" after rotation', (t) => {
  const tilesetHeader = TILESET_STUB();
  tilesetHeader.root = ROOT_TILE_HEADER;
  const tileset = new Tileset3D(tilesetHeader);
  const viewport = new WebMercatorViewport(VIEWPORT_ROTATED_OPTS);
  const frameState = getFrameState(viewport, 1);

  const tileHeader = getTileHeader();
  const tile2 = new Tile3D(tileset, tileHeader);
  const lodResult2 = getLodStatus(tile2, frameState);
  t.equal(lodResult2, 'DRAW');

  t.end();
});

test('I3S LOD#lodJudge - should return "OUT" if projected size too small', (t) => {
  const tilesetHeader = TILESET_STUB();
  tilesetHeader.root = ROOT_TILE_HEADER;
  const tileset = new Tileset3D(tilesetHeader);
  const viewport = new WebMercatorViewport(VIEWPORT_ZOOM_OUT_OPTS);
  const frameState = getFrameState(viewport, 1);

  const tileHeader = getNextAfterRootTileHeader();
  const tile2 = new Tile3D(tileset, tileHeader);
  const lodResult2 = getLodStatus(tile2, frameState);
  t.equal(lodResult2, 'OUT');

  t.end();
});

test('I3S LOD#lodJudge - should return "DIG" in the large LOD metric value case', (t) => {
  const tilesetHeader = TILESET_STUB();
  tilesetHeader.root = ROOT_TILE_HEADER;
  const tileset = new Tileset3D(tilesetHeader);
  const viewport = new WebMercatorViewport(VIEWPORT_NEW_YORK_OPTS);
  const frameState = getFrameState(viewport, 1);

  const tileHeader = getBigLodMetricTileHeader();
  const tile = new Tile3D(tileset, tileHeader);
  const lodResult = getLodStatus(tile, frameState);
  t.equal(lodResult, 'DIG');

  t.end();
});
