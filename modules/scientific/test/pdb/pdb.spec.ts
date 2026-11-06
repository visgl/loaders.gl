// SPDX-License-Identifier: MIT
import {test, expect} from 'vitest';
import {PDBLoaderWithParser} from '../../src/pdb-loader';

const first = 'ATOM      1  N  AALA A   1      11.104   6.134  -6.504  0.50 83.80           N  ';
const second = 'HETATM    2  O   HOH B  10      12.000   7.000  -5.000  1.00 20.00           O  ';
const bonds = 'CONECT    1    2\nCONECT    2    1';

test('PDB preserves fixed-column atom metadata and deduplicates explicit bonds', () => {
  const result = PDBLoaderWithParser.parseTextSync([first, second, bonds].join('\n'));
  expect(result.coordinateUnit).toBe('angstrom');
  expect(result.models[0].atoms[0]).toMatchObject({
    serial: 1,
    name: 'N',
    alternateLocation: 'A',
    chain: 'A',
    residueNumber: 1,
    occupancy: 0.5,
    element: 'N',
    position: [11.104, 6.134, -6.504]
  });
  expect(result.models[0].atoms[1].record).toBe('HETATM');
  expect(result.models[0].bonds).toEqual([[0, 1]]);
});

test('PDB scopes repeated atom serials and global connectivity to each MODEL', () => {
  const result = PDBLoaderWithParser.parseTextSync(
    `HEADER    example\nMODEL        1\n${first}\n${second}\nENDMDL\nMODEL        2\n${first}\n${second}\nENDMDL\n${bonds}`
  );
  expect(result.models.map(model => model.bonds)).toEqual([[[0, 1]], [[0, 1]]]);
  expect(result.records).toEqual(['HEADER    example']);
});

test.each([
  '',
  first + '\n' + first,
  first.replace('11.104', 'NaN   '),
  first + '\nCONECT    1    9',
  'MODEL        1\n' + first,
  'ENDMDL'
])('PDB rejects malformed structure %#', text => {
  expect(() => PDBLoaderWithParser.parseTextSync(text)).toThrow(/PDB/);
});

test('PDB metadata and parser subpath support public async and sync input paths', async () => {
  const {parse} = await import('@loaders.gl/core');
  const {PDBLoader} = await import('../../src/pdb-loader-types');
  const bytes = new TextEncoder().encode(first).buffer;
  expect((await parse(bytes, PDBLoader)).models).toHaveLength(1);
  expect((await PDBLoaderWithParser.parse(bytes)).models).toHaveLength(1);
  expect(PDBLoaderWithParser.parseSync(bytes).models).toHaveLength(1);
  expect((await PDBLoaderWithParser.parseText(first)).models).toHaveLength(1);
});

test.each([
  `${first}\nCONECT    1    1`,
  `${first}\nCONECT    1`,
  `MODEL        1\n${first}\nENDMDL\n${second}`,
  `MODEL        1\n${first}\nENDMDL\nMODEL        1\n${first}\nENDMDL`,
  `MODEL        1\nMODEL        2`,
  `MODEL        1\nENDMDL`
])('PDB rejects invalid model/connectivity structure %#', text => {
  expect(() => PDBLoaderWithParser.parseTextSync(text)).toThrow(/PDB/);
});
