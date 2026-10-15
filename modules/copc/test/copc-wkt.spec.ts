// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {normalizeCOPCProjectionDefinition} from '../src/lib/copc-wkt';

test.each([
  'PROJCS',
  'GEOGCS'
])('COPC extracts a compound %s horizontal CRS with nested brackets', name => {
  const horizontal = `${name}["horizontal [quoted] ""name""",GEOGCS["nested",UNIT["degree",1]]]`;
  expect(
    normalizeCOPCProjectionDefinition(
      `COMPD_CS["combined",${horizontal},VERT_CS["height",UNIT["meter",1]]]`
    )
  ).toBe(horizontal);
});

test('COPC leaves standalone, malformed and non-WKT definitions intact', () => {
  const definition = {name: 'WGS84'};
  expect(normalizeCOPCProjectionDefinition(definition)).toBe(definition);
  for (const value of [
    'EPSG:4978',
    'GEOGCS["standalone"]',
    'COMPD_CS["name",LOCAL_CS["local"],VERT_CS["height"]]',
    'COMPD_CS["name",PROJCS["unclosed",VERT_CS["height"]]',
    'COMPD_CS["name",GEOGCS["horizontal"],VERT_CS["height"]]extra',
    'COMPD_CS["name",GEOGCS["unclosed],VERT_CS["height"]]',
    'COMPD_CS["name",GEOGCS["horizontal"],UNIT["meter",1]]'
  ])
    expect(normalizeCOPCProjectionDefinition(value)).toBe(value);
});

test('COPC handles adversarial repeated WKT delimiters without backtracking', () => {
  for (const prefix of ['PROJCS[', 'GEOGCS[']) {
    const value = `COMPD_CS["name",${prefix.repeat(10000)}],VERT_CS[`.repeat(2);
    expect(normalizeCOPCProjectionDefinition(value)).toBe(value);
  }
});
