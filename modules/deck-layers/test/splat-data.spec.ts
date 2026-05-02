// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import test from 'tape-promise/tape';
import {SplatEngine} from '../src/splat/splat-engine';
import {
  SPLAT_COMPUTE_F32_PARAM_COUNT,
  SPLAT_COMPUTE_PARAM_BYTE_LENGTH,
  SPLAT_COMPUTE_SHADER,
  SPLAT_COMPUTE_U32_PARAM_COUNT,
  SPLAT_COMPUTE_WORKGROUP_SIZE
} from '../src/splat/splat-compute-shaders';
import {projectSplatCovarianceToScreen} from '../src/splat/splat-covariance';
import {getGaussianSplatDataFromArrowTable} from '../src/splat/splat-data';
import {
  getSplatTileBufferByteLengths,
  getSplatTileGrid,
  getSplatTransientBufferByteLengths,
  packSplatDepthKey,
  SPLAT_RADIX_BUCKETS,
  SPLAT_RADIX_PASS_COUNT,
  SPLAT_TILE_RADIX_MAX_SPLATS,
  SPLAT_TILE_RADIX_WORKGROUP_SIZE,
  SPLAT_TILE_SIZE_PIXELS
} from '../src/splat/splat-sort';

/** Creates a minimal Gaussian splat Arrow table. */
function createGaussianSplatTable(): arrow.Table {
  return arrow.tableFromArrays({
    POSITION: [
      [0, 0, -2],
      [1, 2, -1]
    ],
    f_dc_0: [0, 1],
    f_dc_1: [0, 0],
    f_dc_2: [0, -1],
    opacity: [0, 2],
    scale_0: [0, 1],
    scale_1: [0, 0],
    scale_2: [0, -1],
    rot_0: [1, 1],
    rot_1: [0, 0],
    rot_2: [0, 0],
    rot_3: [0, 0]
  });
}

/** Creates a minimal WebGPU-like device for SplatEngine state tests. */
function createTestDevice() {
  return {
    type: 'webgpu',
    createBuffer: (props: {data?: ArrayBufferView; byteLength?: number}) => {
      const buffer = {
        data: props.data,
        byteLength: props.byteLength ?? props.data?.byteLength ?? 0,
        write(data: ArrayBufferView): void {
          buffer.data = data;
        },
        destroy(): void {}
      };
      return buffer;
    }
  } as any;
}

test('splat-data extracts shared Gaussian splat columns', t => {
  const data = getGaussianSplatDataFromArrowTable(createGaussianSplatTable());

  t.equal(data.length, 2, 'extracts row count');
  t.deepEqual(Array.from(data.positions), [0, 0, -2, 1, 2, -1], 'extracts positions');
  t.deepEqual(Array.from(data.rotations), [1, 0, 0, 0, 1, 0, 0, 0], 'extracts rotations');
  t.equal(data.radii[0], 3, 'decodes log scale support radius');
  t.ok(Math.abs(data.opacities[0] - 0.5) < 1e-6, 'decodes logit opacity');
  t.deepEqual(Array.from(data.colors.slice(0, 4)), [128, 128, 128, 128], 'derives color');
  t.end();
});

test('splat-data reports missing required columns', t => {
  const table = arrow.tableFromArrays({
    POSITION: [[0, 0, 0]]
  });

  t.throws(
    () => getGaussianSplatDataFromArrowTable(table),
    /SplatLayer requires a scale_0 column/,
    'throws a clear error for missing required columns'
  );
  t.end();
});

test('splat-sort exposes radix constants and key packing', t => {
  const nearKey = packSplatDepthKey(0, {depthMin: 0, depthMax: 10});
  const farKey = packSplatDepthKey(10, {depthMin: 0, depthMax: 10});
  const byteLengths = getSplatTransientBufferByteLengths(2);

  t.equal(SPLAT_RADIX_BUCKETS, 16, 'uses 4-bit radix buckets');
  t.equal(SPLAT_RADIX_PASS_COUNT, 8, 'uses eight radix passes');
  t.ok(farKey < nearKey, 'farther depth sorts before nearer depth');
  t.equal(byteLengths.indices, 8, 'allocates one u32 per index');
  t.equal(byteLengths.projected, 64, 'allocates two vec4<f32> entries per projected splat');
  t.end();
});

test('splat-covariance projects identity rotation to axis-aligned ellipse', t => {
  const covariance = projectSplatCovarianceToScreen({
    position: [0, 0, 0],
    scale: [2, 1, 0],
    rotation: [1, 0, 0, 0],
    viewportSize: [100, 100]
  });

  t.ok(Math.abs(Math.abs(covariance.axis0[0]) - 100) < 1e-6, 'projects major axis horizontally');
  t.ok(Math.abs(covariance.axis0[1]) < 1e-6, 'keeps horizontal major axis aligned');
  t.ok(Math.abs(covariance.maxAxisPixels - 100) < 1e-6, 'reports major one-sigma axis length');
  t.end();
});

test('splat-covariance applies quaternion rotation to ellipse axes', t => {
  const angle = Math.PI / 2;
  const covariance = projectSplatCovarianceToScreen({
    position: [0, 0, 0],
    scale: [2, 1, 0],
    rotation: [Math.cos(angle / 2), 0, 0, Math.sin(angle / 2)],
    viewportSize: [100, 100]
  });

  t.ok(Math.abs(covariance.axis0[0]) < 1e-6, 'rotates major axis away from screen x');
  t.ok(
    Math.abs(Math.abs(covariance.axis0[1]) - 100) < 1e-6,
    'projects rotated major axis vertically'
  );
  t.end();
});

test('splat-covariance returns finite axes for degenerate scale', t => {
  const covariance = projectSplatCovarianceToScreen({
    position: [0, 0, 0],
    scale: [0, 0, 0],
    rotation: [0, 0, 0, 0],
    viewportSize: [100, 100]
  });

  t.ok(Number.isFinite(covariance.axis0[0]), 'returns finite axis0 x');
  t.ok(Number.isFinite(covariance.axis1[1]), 'returns finite axis1 y');
  t.ok(covariance.maxAxisPixels > 0, 'returns a non-zero fallback axis length');
  t.end();
});

test('splat-covariance remains finite under perspective projection', t => {
  const covariance = projectSplatCovarianceToScreen({
    position: [0, 0, -2],
    scale: [1, 1, 1],
    rotation: [1, 0, 0, 0],
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1, 0, 0, 0, 0],
    viewportSize: [200, 100]
  });

  t.ok(Number.isFinite(covariance.axis0[0]), 'returns finite projected axis');
  t.ok(covariance.maxAxisPixels > 0, 'returns positive projected axis length');
  t.end();
});

test('splat-covariance applies 2D kernel inflation and screen-size clamp', t => {
  const inflated = projectSplatCovarianceToScreen({
    position: [0, 0, 0],
    scale: [0, 0, 0],
    rotation: [1, 0, 0, 0],
    viewportSize: [100, 100],
    kernel2DSize: 0.5
  });
  const clamped = projectSplatCovarianceToScreen({
    position: [0, 0, 0],
    scale: [4, 0, 0],
    rotation: [1, 0, 0, 0],
    viewportSize: [100, 100],
    maxScreenSpaceSplatSize: 10
  });

  t.ok(inflated.maxAxisPixels >= 0.5, 'inflates degenerate covariance by kernel size');
  t.equal(clamped.maxAxisPixels, 10, 'clamps oversized screen-space covariance');
  t.end();
});

test('SplatEngine exposes oriented projected data and visibility', t => {
  const engine = new SplatEngine(createTestDevice(), {
    sortMode: 'global',
    alphaCutoff: 0,
    screenSizeCutoffPixels: 0,
    gaussianSupportRadius: 3,
    kernel2DSize: 0,
    maxScreenSpaceSplatSize: 1024
  });
  engine.setData(createGaussianSplatTable(), [255, 255, 255, 255]);
  engine.update({viewportSize: [100, 100], radiusScale: 1});

  const projected = engine.getProjectedDataForTesting(0);
  t.equal(engine.getRenderSplatCount(), 2, 'renders visible splats through compact index buffer');
  t.deepEqual(projected.axis0, [50, 0], 'stores first one-sigma screen axis');
  t.deepEqual(projected.axis1, [0, 50], 'stores second one-sigma screen axis');
  t.equal(projected.maxAxisPixels, 50, 'stores maximum one-sigma screen axis length');
  t.equal(projected.visible, 1, 'marks visible splat');

  engine.setProps({screenSizeCutoffPixels: 200});
  engine.update({viewportSize: [100, 100], radiusScale: 1});
  t.equal(engine.getProjectedDataForTesting(0).visible, 0, 'applies rendered ellipse size cutoff');
  t.equal(engine.getRenderSplatCount(), 1, 'removes culled splats from render count');
  engine.destroy();
  t.end();
});

test('SplatEngine supports tile-local visible index ordering', t => {
  const engine = new SplatEngine(createTestDevice(), {
    sortMode: 'tile',
    alphaCutoff: 0,
    screenSizeCutoffPixels: 0,
    gaussianSupportRadius: 3,
    kernel2DSize: 0,
    maxScreenSpaceSplatSize: 1024
  });
  engine.setData(createGaussianSplatTable(), [255, 255, 255, 255]);
  engine.update({viewportSize: [100, 100], radiusScale: 1});

  t.equal(engine.getRenderSplatCount(), 2, 'keeps visible tile-binned splats');
  t.equal(engine.getSortedIndicesForTesting().length, 2, 'stores compact tile-binned indices');
  engine.destroy();
  t.end();
});

test('splat-sort calculates tile grid and buffer sizes', t => {
  const tileGrid = getSplatTileGrid(1920, 1080);
  const byteLengths = getSplatTileBufferByteLengths(1000, tileGrid);

  t.equal(SPLAT_TILE_SIZE_PIXELS, 16, 'uses 16 pixel default tiles');
  t.equal(SPLAT_TILE_RADIX_MAX_SPLATS, 1024, 'reserves 1024 splats per tile workgroup');
  t.equal(SPLAT_TILE_RADIX_WORKGROUP_SIZE, 256, 'uses 256 lane tile radix workgroups');
  t.equal(tileGrid.columns, 120, 'calculates tile columns');
  t.equal(tileGrid.rows, 68, 'calculates tile rows');
  t.equal(tileGrid.tileCount, 8160, 'calculates tile count');
  t.equal(byteLengths.tileCounts, 8160 * 4, 'allocates one count per tile');
  t.equal(byteLengths.tileOffsets, 8161 * 4, 'allocates sentinel tile offset');
  t.equal(byteLengths.tileIndices, 1000 * 4, 'allocates compacted splat references');
  t.equal(byteLengths.overflowCount, 4, 'allocates overflow counter');
  t.equal(byteLengths.overflowIndices, 4, 'allocates at least one overflow slot');
  t.end();
});

test('splat-compute shader exposes projection and tile-sort entry points', t => {
  t.equal(SPLAT_COMPUTE_WORKGROUP_SIZE, 256, 'uses 256 lane compute workgroups');
  t.equal(SPLAT_COMPUTE_F32_PARAM_COUNT, 48, 'reserves f32 matrix, viewport, and plane params');
  t.equal(SPLAT_COMPUTE_U32_PARAM_COUNT, 8, 'reserves u32 count and tile params');
  t.equal(SPLAT_COMPUTE_PARAM_BYTE_LENGTH, 224, 'packs compute params into one uniform buffer');
  t.ok(SPLAT_COMPUTE_SHADER.includes('fn clear('), 'includes clear entry point');
  t.ok(SPLAT_COMPUTE_SHADER.includes('fn project('), 'includes project entry point');
  t.ok(SPLAT_COMPUTE_SHADER.includes('fn scanTiles('), 'includes tile scan entry point');
  t.ok(SPLAT_COMPUTE_SHADER.includes('fn scatterTiles('), 'includes scatter entry point');
  t.ok(SPLAT_COMPUTE_SHADER.includes('fn tileSort('), 'includes tile sort entry point');
  t.ok(SPLAT_COMPUTE_SHADER.includes('fn copySorted('), 'includes sorted copy entry point');
  t.end();
});
