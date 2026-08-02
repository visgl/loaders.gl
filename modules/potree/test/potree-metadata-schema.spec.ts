// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fetchFile, parse} from '@loaders.gl/core';
import {PotreeLoader, PotreeMetadataSchema} from '@loaders.gl/potree';
import {describe, expect, it} from 'vitest';
import {z} from 'zod';

const POTREE_METADATA_URL = '@loaders.gl/potree/test/data/lion_takanawa/cloud.js';

describe('PotreeMetadataSchema', () => {
  it('validates the Potree 1.7 fixture through the loader', async () => {
    const metadata = await parse(await fetchFile(POTREE_METADATA_URL), PotreeLoader);

    expect(metadata.version).toBe('1.7');
    expect(metadata.pointAttributes).toContain('POSITION_CARTESIAN');
  });

  it('rejects malformed required metadata', () => {
    expect(
      PotreeMetadataSchema.safeParse({
        version: '1.7',
        octreeDir: 'data',
        boundingBox: {},
        tightBoundingBox: {},
        pointAttributes: [],
        spacing: 0,
        scale: 0,
        hierarchyStepSize: 0
      }).success
    ).toBe(false);
  });

  it('can be exported as JSON Schema', () => {
    const jsonSchema = z.toJSONSchema(PotreeMetadataSchema, {target: 'draft-7'});
    expect(jsonSchema.required).toContain('version');
    expect(jsonSchema.required).toContain('pointAttributes');
  });
});
