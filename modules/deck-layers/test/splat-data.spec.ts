// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
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
test('splat-data extracts shared Gaussian splat columns', () => {
  const data = getGaussianSplatDataFromArrowTable(createGaussianSplatTable());
  expect(data.length, 'extracts row count').toBe(2);
  expect(Array.from(data.positions), 'extracts positions').toEqual([0, 0, -2, 1, 2, -1]);
  expect(Array.from(data.rotations), 'extracts rotations').toEqual([1, 0, 0, 0, 1, 0, 0, 0]);
  expect(data.radii[0], 'decodes log scale support radius').toBe(3);
  expect(Math.abs(data.opacities[0] - 0.5) < 1e-6, 'decodes logit opacity').toBeTruthy();
  expect(Array.from(data.colors.slice(0, 4)), 'derives color').toEqual([128, 128, 128, 128]);
});
test('splat-data reports missing required columns', () => {
  const table = arrow.tableFromArrays({
    POSITION: [[0, 0, 0]]
  });
  expect(
    () => getGaussianSplatDataFromArrowTable(table),
    'throws a clear error for missing required columns'
  ).toThrow(/SplatLayer requires a scale_0 column/);
});
test('splat-sort exposes radix constants and key packing', () => {
  const nearKey = packSplatDepthKey(0, {depthMin: 0, depthMax: 10});
  const farKey = packSplatDepthKey(10, {depthMin: 0, depthMax: 10});
  const byteLengths = getSplatTransientBufferByteLengths(2);
  expect(SPLAT_RADIX_BUCKETS, 'uses 4-bit radix buckets').toBe(16);
  expect(SPLAT_RADIX_PASS_COUNT, 'uses eight radix passes').toBe(8);
  expect(farKey < nearKey, 'farther depth sorts before nearer depth').toBeTruthy();
  expect(byteLengths.indices, 'allocates one u32 per index').toBe(8);
  expect(byteLengths.projected, 'allocates two vec4<f32> entries per projected splat').toBe(64);
});
test('splat-covariance projects identity rotation to axis-aligned ellipse', () => {
  const covariance = projectSplatCovarianceToScreen({
    position: [0, 0, 0],
    scale: [2, 1, 0],
    rotation: [1, 0, 0, 0],
    viewportSize: [100, 100]
  });
  expect(
    Math.abs(Math.abs(covariance.axis0[0]) - 100) < 1e-6,
    'projects major axis horizontally'
  ).toBeTruthy();
  expect(Math.abs(covariance.axis0[1]) < 1e-6, 'keeps horizontal major axis aligned').toBeTruthy();
  expect(
    Math.abs(covariance.maxAxisPixels - 100) < 1e-6,
    'reports major one-sigma axis length'
  ).toBeTruthy();
});
test('splat-covariance applies quaternion rotation to ellipse axes', () => {
  const angle = Math.PI / 2;
  const covariance = projectSplatCovarianceToScreen({
    position: [0, 0, 0],
    scale: [2, 1, 0],
    rotation: [Math.cos(angle / 2), 0, 0, Math.sin(angle / 2)],
    viewportSize: [100, 100]
  });
  expect(
    Math.abs(covariance.axis0[0]) < 1e-6,
    'rotates major axis away from screen x'
  ).toBeTruthy();
  expect(
    Math.abs(Math.abs(covariance.axis0[1]) - 100) < 1e-6,
    'projects rotated major axis vertically'
  ).toBeTruthy();
});
test('splat-covariance returns finite axes for degenerate scale', () => {
  const covariance = projectSplatCovarianceToScreen({
    position: [0, 0, 0],
    scale: [0, 0, 0],
    rotation: [0, 0, 0, 0],
    viewportSize: [100, 100]
  });
  expect(Number.isFinite(covariance.axis0[0]), 'returns finite axis0 x').toBeTruthy();
  expect(Number.isFinite(covariance.axis1[1]), 'returns finite axis1 y').toBeTruthy();
  expect(covariance.maxAxisPixels > 0, 'returns a non-zero fallback axis length').toBeTruthy();
});
test('splat-covariance remains finite under perspective projection', () => {
  const covariance = projectSplatCovarianceToScreen({
    position: [0, 0, -2],
    scale: [1, 1, 1],
    rotation: [1, 0, 0, 0],
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1, 0, 0, 0, 0],
    viewportSize: [200, 100]
  });
  expect(Number.isFinite(covariance.axis0[0]), 'returns finite projected axis').toBeTruthy();
  expect(covariance.maxAxisPixels > 0, 'returns positive projected axis length').toBeTruthy();
});
test('splat-covariance applies 2D kernel inflation and screen-size clamp', () => {
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
  expect(
    inflated.maxAxisPixels >= 0.5,
    'inflates degenerate covariance by kernel size'
  ).toBeTruthy();
  expect(clamped.maxAxisPixels, 'clamps oversized screen-space covariance').toBe(10);
});
test('SplatEngine exposes oriented projected data and visibility', () => {
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
  expect(engine.getRenderSplatCount(), 'renders visible splats through compact index buffer').toBe(
    2
  );
  expect(projected.axis0, 'stores first one-sigma screen axis').toEqual([50, 0]);
  expect(projected.axis1, 'stores second one-sigma screen axis').toEqual([expect.any(Number), 50]);
  expect(Math.abs(projected.axis1[0]), 'stores a zero horizontal component').toBe(0);
  expect(projected.maxAxisPixels, 'stores maximum one-sigma screen axis length').toBe(50);
  expect(projected.visible, 'marks visible splat').toBe(1);
  engine.setProps({screenSizeCutoffPixels: 200});
  engine.update({viewportSize: [100, 100], radiusScale: 1});
  expect(engine.getProjectedDataForTesting(0).visible, 'applies rendered ellipse size cutoff').toBe(
    0
  );
  expect(engine.getRenderSplatCount(), 'removes culled splats from render count').toBe(1);
  engine.destroy();
});
test('SplatEngine exposes WebGL binary attributes', () => {
  const engine = new SplatEngine({type: 'webgl'} as any, {
    gaussianSupportRadius: 3,
    sortMode: 'global',
    alphaCutoff: 0,
    screenSizeCutoffPixels: 0,
    kernel2DSize: 0,
    maxScreenSpaceSplatSize: 1024
  });
  engine.setData(createGaussianSplatTable(), [255, 255, 255, 255]);
  const webGLAttributes = engine.getWebGLAttributes();
  expect(webGLAttributes.length, 'exposes one rendered object per splat').toBe(2);
  expect(
    Array.from(webGLAttributes.attributes.getPosition.value),
    'exposes interleaved positions'
  ).toEqual([0, 0, -2, 1, 2, -1]);
  expect(webGLAttributes.attributes.getRadius.value[0], 'exposes decoded radii').toBe(3);
  expect(
    Array.from(webGLAttributes.attributes.getColor.value.slice(0, 4)),
    'exposes unorm8 colors'
  ).toEqual([128, 128, 128, 128]);
  engine.destroy();
});
test('SplatEngine supports tile-local visible index ordering', () => {
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
  expect(engine.getRenderSplatCount(), 'keeps visible tile-binned splats').toBe(2);
  expect(engine.getSortedIndicesForTesting().length, 'stores compact tile-binned indices').toBe(2);
  engine.destroy();
});
test('splat-sort calculates tile grid and buffer sizes', () => {
  const tileGrid = getSplatTileGrid(1920, 1080);
  const byteLengths = getSplatTileBufferByteLengths(1000, tileGrid);
  expect(SPLAT_TILE_SIZE_PIXELS, 'uses 16 pixel default tiles').toBe(16);
  expect(SPLAT_TILE_RADIX_MAX_SPLATS, 'reserves 1024 splats per tile workgroup').toBe(1024);
  expect(SPLAT_TILE_RADIX_WORKGROUP_SIZE, 'uses 256 lane tile radix workgroups').toBe(256);
  expect(tileGrid.columns, 'calculates tile columns').toBe(120);
  expect(tileGrid.rows, 'calculates tile rows').toBe(68);
  expect(tileGrid.tileCount, 'calculates tile count').toBe(8160);
  expect(byteLengths.tileCounts, 'allocates one count per tile').toBe(8160 * 4);
  expect(byteLengths.tileOffsets, 'allocates sentinel tile offset').toBe(8161 * 4);
  expect(byteLengths.tileIndices, 'allocates compacted splat references').toBe(1000 * 4);
  expect(byteLengths.overflowCount, 'allocates overflow counter').toBe(4);
  expect(byteLengths.overflowIndices, 'allocates at least one overflow slot').toBe(4);
});
test('splat-compute shader exposes projection and tile-sort entry points', () => {
  expect(SPLAT_COMPUTE_WORKGROUP_SIZE, 'uses 256 lane compute workgroups').toBe(256);
  expect(SPLAT_COMPUTE_F32_PARAM_COUNT, 'reserves f32 matrix, viewport, and plane params').toBe(48);
  expect(SPLAT_COMPUTE_U32_PARAM_COUNT, 'reserves u32 count and tile params').toBe(8);
  expect(SPLAT_COMPUTE_PARAM_BYTE_LENGTH, 'packs compute params into one uniform buffer').toBe(224);
  expect(SPLAT_COMPUTE_SHADER.includes('fn clear('), 'includes clear entry point').toBeTruthy();
  expect(SPLAT_COMPUTE_SHADER.includes('fn project('), 'includes project entry point').toBeTruthy();
  expect(
    SPLAT_COMPUTE_SHADER.includes('fn scanTiles('),
    'includes tile scan entry point'
  ).toBeTruthy();
  expect(
    SPLAT_COMPUTE_SHADER.includes('fn scatterTiles('),
    'includes scatter entry point'
  ).toBeTruthy();
  expect(
    SPLAT_COMPUTE_SHADER.includes('fn tileSort('),
    'includes tile sort entry point'
  ).toBeTruthy();
  expect(
    SPLAT_COMPUTE_SHADER.includes('fn copySorted('),
    'includes sorted copy entry point'
  ).toBeTruthy();
});
