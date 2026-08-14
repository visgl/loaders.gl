// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {SubtreeSchema} from '@loaders.gl/3d-tiles/subtree-schema';
import {describe, expect, it} from 'vitest';
import {z} from 'zod';

describe('SubtreeSchema', () => {
  it('accepts constant availability without buffers', () => {
    const subtree = SubtreeSchema.parse({
      tileAvailability: {constant: 1},
      contentAvailability: {constant: 1},
      childSubtreeAvailability: {constant: 0}
    });

    expect(subtree.buffers).toEqual([]);
    expect(subtree.bufferViews).toEqual([]);
  });

  it('accepts current and legacy bitstream property names', () => {
    expect(SubtreeSchema.safeParse(createBitstreamSubtree('bitstream')).success).toBe(true);
    expect(SubtreeSchema.safeParse(createBitstreamSubtree('bufferView')).success).toBe(true);
  });

  it('rejects malformed availability and buffer references', () => {
    expect(
      SubtreeSchema.safeParse({
        tileAvailability: {},
        childSubtreeAvailability: {constant: 0}
      }).success
    ).toBe(false);
    expect(
      SubtreeSchema.safeParse({
        buffers: [{byteLength: -1}],
        tileAvailability: {constant: 1},
        childSubtreeAvailability: {constant: 0}
      }).success
    ).toBe(false);
  });

  it('can be exported as JSON Schema', () => {
    const jsonSchema = z.toJSONSchema(SubtreeSchema, {target: 'draft-7'});
    const serializedJsonSchema = JSON.stringify(jsonSchema);

    expect(jsonSchema.required).toContain('tileAvailability');
    expect(jsonSchema.required).toContain('childSubtreeAvailability');
    expect(serializedJsonSchema).toContain('contentAvailability');
  });
});

/** Creates a valid subtree using the requested availability index property. */
function createBitstreamSubtree(property: 'bitstream' | 'bufferView') {
  return {
    buffers: [{byteLength: 1}],
    bufferViews: [{buffer: 0, byteOffset: 0, byteLength: 1}],
    tileAvailability: {[property]: 0},
    childSubtreeAvailability: {constant: 0}
  };
}
