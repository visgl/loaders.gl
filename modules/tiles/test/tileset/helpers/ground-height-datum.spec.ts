// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {resolveGroundHeightDatum} from '../../../src/tileset-3d/helpers/frame-state';

// Root region of the swisstopo swissBUILDINGS3D tileset (issue #3475):
// [west, south, east, north, minimumHeight, maximumHeight], angles in radians, heights in meters.
const SWISS_ROOT_REGION = [
  0.10401182679403116, 0.7996693586576467, 0.18312399144408265, 0.8343189318329005, 149.268,
  4563.933
];

// Bahnhofstrasse, Zürich — inside the root region.
const ZURICH = {longitude: 8.5391, latitude: 47.3686};
const ZURICH_LON_RAD = (ZURICH.longitude * Math.PI) / 180;
const ZURICH_LAT_RAD = (ZURICH.latitude * Math.PI) / 180;

function regionAroundZurich(minimumHeight: number, maximumHeight: number, paddingRadians = 0.001) {
  return [
    ZURICH_LON_RAD - paddingRadians,
    ZURICH_LAT_RAD - paddingRadians,
    ZURICH_LON_RAD + paddingRadians,
    ZURICH_LAT_RAD + paddingRadians,
    minimumHeight,
    maximumHeight
  ];
}

const SWISS_ROOT_TILE = {header: {boundingVolume: {region: SWISS_ROOT_REGION}}};

test('resolveGroundHeightDatum#explicit number overrides auto derivation', t => {
  t.equals(
    resolveGroundHeightDatum(250, SWISS_ROOT_TILE, ZURICH),
    250,
    'explicit datum wins over region-derived heights'
  );
  t.equals(
    resolveGroundHeightDatum(0, SWISS_ROOT_TILE, ZURICH),
    0,
    'explicit 0 disables auto derivation'
  );
  t.equals(
    resolveGroundHeightDatum(-100, SWISS_ROOT_TILE, ZURICH),
    -100,
    'negative explicit datum is preserved'
  );
  t.equals(
    resolveGroundHeightDatum(NaN, SWISS_ROOT_TILE, ZURICH),
    0,
    'non-finite explicit datum resolves to 0'
  );
  t.end();
});

test('resolveGroundHeightDatum#auto derives the root region minimum height', t => {
  t.equals(
    resolveGroundHeightDatum('auto', SWISS_ROOT_TILE, ZURICH),
    149.268,
    'auto resolves to the root region minimumHeight when no children are loaded'
  );
  t.equals(
    resolveGroundHeightDatum(
      'auto',
      {header: {boundingVolume: {region: [0, 0, 1, 1, -100, 50]}}},
      {longitude: 28.6, latitude: 28.6}
    ),
    -100,
    'below-sea-level region minimum is preserved'
  );
  t.end();
});

test('resolveGroundHeightDatum#auto refines to the deepest loaded region containing the viewport center', t => {
  const rootTile = {
    header: {boundingVolume: {region: SWISS_ROOT_REGION}},
    children: [
      {
        // Contains Zürich — should be descended.
        header: {boundingVolume: {region: regionAroundZurich(395, 493, 0.01)}},
        children: [
          {
            // Leaf region around the viewport center: local ground ≈ 405 m.
            header: {boundingVolume: {region: regionAroundZurich(405, 438)}}
          },
          {
            // Does NOT contain the viewport center — must be ignored despite higher minimum.
            header: {boundingVolume: {region: [0.11, 0.8, 0.112, 0.802, 1600, 1900]}}
          }
        ]
      },
      {
        // Sibling not containing Zürich.
        header: {boundingVolume: {region: [0.17, 0.82, 0.18, 0.83, 900, 1200]}}
      }
    ]
  };

  t.equals(
    resolveGroundHeightDatum('auto', rootTile, ZURICH),
    405,
    'auto resolves to the deepest loaded containing region minimumHeight'
  );
  t.equals(
    resolveGroundHeightDatum('auto', rootTile, {longitude: 120, latitude: -30}),
    149.268,
    'viewport center outside all child regions falls back to the root region minimumHeight'
  );
  t.end();
});

test('resolveGroundHeightDatum#auto falls back to 0 without a usable region', t => {
  t.equals(
    resolveGroundHeightDatum(
      'auto',
      {header: {boundingVolume: {box: [0, 0, 0, 8000000, 0, 0, 0, 8000000, 0, 0, 0, 8000000]}}},
      ZURICH
    ),
    0,
    'box bounding volume resolves to 0'
  );
  t.equals(
    resolveGroundHeightDatum('auto', {header: {boundingVolume: {sphere: [0, 0, 0, 5000]}}}, ZURICH),
    0,
    'sphere bounding volume resolves to 0'
  );
  t.equals(
    resolveGroundHeightDatum('auto', {header: {}}, ZURICH),
    0,
    'header without bounding volume resolves to 0'
  );
  t.equals(resolveGroundHeightDatum('auto', null, ZURICH), 0, 'null tile resolves to 0');
  t.equals(resolveGroundHeightDatum('auto', undefined, ZURICH), 0, 'missing tile resolves to 0');
  t.equals(
    resolveGroundHeightDatum('auto', {header: {boundingVolume: {region: [0, 0, 1, 1]}}}, ZURICH),
    0,
    'truncated region resolves to 0'
  );
  t.equals(
    resolveGroundHeightDatum(
      'auto',
      {header: {boundingVolume: {region: [0, 0, 1, 1, NaN, 50]}}},
      ZURICH
    ),
    0,
    'non-finite region minimum resolves to 0'
  );
  t.end();
});

test('resolveGroundHeightDatum#auto terminates on cyclic tile graphs', t => {
  const cyclic: any = {header: {boundingVolume: {region: regionAroundZurich(400, 450)}}};
  cyclic.children = [cyclic];
  t.equals(
    resolveGroundHeightDatum('auto', cyclic, ZURICH),
    400,
    'cyclic children do not hang the derivation'
  );
  t.end();
});
