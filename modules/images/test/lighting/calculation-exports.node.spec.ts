// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {execFileSync} from 'node:child_process';
import {expect, test} from 'vitest';

test('published lighting and LUT utilities work in native ESM and CommonJS without image codecs', () => {
  const output = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import assert from 'node:assert/strict';
    import {createRequire} from 'node:module';
    const require = createRequire(import.meta.url);
    const variants = [
      [await import('@loaders.gl/images/lighting'), await import('@loaders.gl/images/color-lut')],
      [require('@loaders.gl/images/lighting'), require('@loaders.gl/images/color-lut')]
    ];
    for (const [lighting, colors] of variants) {
      const profile = {photometricType: 1, verticalAngles: Float64Array.of(0, 180), horizontalAngles: Float64Array.of(0), candelaValues: Float64Array.of(2, 2), candelaMultiplier: 3};
      assert.equal(lighting.createIESSampler(profile)(90, 45), 6);
      assert.ok(Math.abs(lighting.integrateIESProfile(profile) - 24 * Math.PI) < 1e-10);
      assert.equal(typeof lighting.resampleIESProfile, 'function');
      const lut = {dimension: 1, size: 2, data: Float32Array.of(0, 0, 0, 1, 1, 1), domainMinimum: [0, 0, 0], domainMaximum: [1, 1, 1]};
      assert.deepEqual(colors.createColorLUTSampler(lut)(0.25, 0.5, 0.75), [0.25, 0.5, 0.75]);
      assert.equal(typeof colors.applyColorLUT, 'function');
    }
    assert.equal(Object.keys(require.cache).some(filename => /sharp|three|canvas/.test(filename)), false);
    console.log('Calculation entrypoints verified');
  `
    ],
    {encoding: 'utf8'}
  );
  expect(output.trim()).toBe('Calculation entrypoints verified');
});
