// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '@luma.gl/shaders';

/** Explicit binding in luma.gl's group-0 module range for the unfilterable float layout. */
const RASTER_TEXTURE_BINDING = 200;

/** WebGPU layout override for the manually sampled r32float texture. */
export const rasterTextureLayout = {
  attributes: [],
  bindings: [
    {
      name: 'rasterTexture',
      type: 'texture' as const,
      group: 0,
      location: RASTER_TEXTURE_BINDING,
      sampleType: 'unfilterable-float' as const
    }
  ]
};

/** Uniforms and manual raster sampling for the BitmapLayer fragment stage. */
export const rasterBitmapUniforms: ShaderModule = {
  name: 'rasterBitmap',
  uniformTypes: {
    valueRange: 'vec2<f32>',
    noData: 'f32',
    useNoData: 'f32',
    valueScale: 'f32',
    linearInterpolation: 'f32',
    interpolateColormap: 'f32'
  },
  fs: /* glsl */ `
layout(std140) uniform rasterBitmapUniforms {
  vec2 valueRange;
  float noData;
  float useNoData;
  float valueScale;
  float linearInterpolation;
  float interpolateColormap;
} rasterBitmap;

uniform highp sampler2D rasterTexture;
uniform sampler2D rasterColormap;

vec2 raster_read(ivec2 pixel, ivec2 size, float weight) {
  float value = texelFetch(rasterTexture, clamp(pixel, ivec2(0), size - 1), 0).r;
  if (weight == 0.0 || isnan(value) || isinf(value) ||
      (rasterBitmap.useNoData > 0.5 && value == rasterBitmap.noData)) {
    return vec2(0.0);
  }
  return vec2(value * weight, weight);
}

vec4 raster_sample(vec2 uv) {
  ivec2 size = textureSize(rasterTexture, 0);
  vec2 position = clamp(uv, 0.0, 1.0) * vec2(size);
  vec2 weightedValue;
  if (rasterBitmap.linearInterpolation > 0.5) {
    position -= 0.5;
    ivec2 base = ivec2(floor(position));
    vec2 fraction = fract(position);
    weightedValue =
      raster_read(base, size, (1.0 - fraction.x) * (1.0 - fraction.y)) +
      raster_read(base + ivec2(1, 0), size, fraction.x * (1.0 - fraction.y)) +
      raster_read(base + ivec2(0, 1), size, (1.0 - fraction.x) * fraction.y) +
      raster_read(base + ivec2(1, 1), size, fraction.x * fraction.y);
  } else {
    weightedValue = raster_read(ivec2(position), size, 1.0);
  }
  if (weightedValue.y == 0.0) {
    discard;
  }

  float value = weightedValue.x / weightedValue.y;
  float span = rasterBitmap.valueRange.y - rasterBitmap.valueRange.x;
  float normalized = span == 0.0 ? 0.0 :
    clamp((value - rasterBitmap.valueRange.x) / span, 0.0, 1.0);
  if (rasterBitmap.valueScale > 1.5) {
    normalized = log(1.0 + 9.0 * normalized) / log(10.0);
  } else if (rasterBitmap.valueScale > 0.5) {
    normalized = sqrt(normalized);
  }
  float colorIndex = normalized * 255.0;
  if (rasterBitmap.interpolateColormap > 0.5) {
    int lowerIndex = int(floor(colorIndex));
    vec4 lowerColor = texelFetch(rasterColormap, ivec2(lowerIndex, 0), 0);
    vec4 upperColor = texelFetch(rasterColormap, ivec2(min(lowerIndex + 1, 255), 0), 0);
    return mix(lowerColor, upperColor, fract(colorIndex));
  }
  return texelFetch(rasterColormap, ivec2(int(floor(colorIndex + 0.5)), 0), 0);
}

vec2 raster_pickingUV(vec2 uv) {
  vec2 size = vec2(textureSize(rasterTexture, 0));
  vec2 pixel = min(floor(clamp(uv, 0.0, 1.0) * size), size - 1.0);
  // Round up only when BitmapLayer's truncation would address the previous texel.
  vec2 firstCode = ceil(pixel * 4096.0 / size);
  return clamp(max(uv, firstCode / 4096.0), 0.0, 4095.0 / 4096.0);
}
`,
  source: /* wgsl */ `
struct RasterBitmapUniforms {
  valueRange: vec2<f32>,
  noData: f32,
  useNoData: f32,
  valueScale: f32,
  linearInterpolation: f32,
  interpolateColormap: f32,
};

@group(0) @binding(auto) var<uniform> rasterBitmap: RasterBitmapUniforms;
@group(0) @binding(${RASTER_TEXTURE_BINDING}) var rasterTexture: texture_2d<f32>;
@group(0) @binding(auto) var rasterColormap: texture_2d<f32>;

fn raster_read(pixel: vec2<i32>, size: vec2<i32>, weight: f32) -> vec2<f32> {
  let value = textureLoad(rasterTexture, clamp(pixel, vec2<i32>(0), size - 1), 0).r;
  // Test exponent bits so NaN detection also works with relaxed floating-point optimizations.
  let nonFinite = (bitcast<u32>(value) & 0x7f800000u) == 0x7f800000u;
  if (weight == 0.0 || nonFinite ||
      (rasterBitmap.useNoData > 0.5 && value == rasterBitmap.noData)) {
    return vec2<f32>(0.0);
  }
  return vec2<f32>(value * weight, weight);
}

fn raster_sample(uv: vec2<f32>) -> vec4<f32> {
  let size = vec2<i32>(textureDimensions(rasterTexture));
  var position = clamp(uv, vec2<f32>(0.0), vec2<f32>(1.0)) * vec2<f32>(size);
  var weightedValue: vec2<f32>;
  if (rasterBitmap.linearInterpolation > 0.5) {
    position -= 0.5;
    let base = vec2<i32>(floor(position));
    let fraction = fract(position);
    weightedValue =
      raster_read(base, size, (1.0 - fraction.x) * (1.0 - fraction.y)) +
      raster_read(base + vec2<i32>(1, 0), size, fraction.x * (1.0 - fraction.y)) +
      raster_read(base + vec2<i32>(0, 1), size, (1.0 - fraction.x) * fraction.y) +
      raster_read(base + vec2<i32>(1, 1), size, fraction.x * fraction.y);
  } else {
    weightedValue = raster_read(vec2<i32>(position), size, 1.0);
  }
  if (weightedValue.y == 0.0) {
    discard;
  }

  let value = weightedValue.x / weightedValue.y;
  let span = rasterBitmap.valueRange.y - rasterBitmap.valueRange.x;
  var normalized = 0.0;
  if (span != 0.0) {
    normalized = clamp((value - rasterBitmap.valueRange.x) / span, 0.0, 1.0);
  }
  if (rasterBitmap.valueScale > 1.5) {
    normalized = log(1.0 + 9.0 * normalized) / log(10.0);
  } else if (rasterBitmap.valueScale > 0.5) {
    normalized = sqrt(normalized);
  }
  let colorIndex = normalized * 255.0;
  if (rasterBitmap.interpolateColormap > 0.5) {
    let lowerIndex = i32(floor(colorIndex));
    let lowerColor = textureLoad(rasterColormap, vec2<i32>(lowerIndex, 0), 0);
    let upperColor = textureLoad(rasterColormap, vec2<i32>(min(lowerIndex + 1, 255), 0), 0);
    return mix(lowerColor, upperColor, fract(colorIndex));
  }
  return textureLoad(rasterColormap, vec2<i32>(i32(floor(colorIndex + 0.5)), 0), 0);
}

fn raster_pickingUV(uv: vec2<f32>) -> vec2<f32> {
  let size = vec2<f32>(textureDimensions(rasterTexture));
  let pixel = min(floor(clamp(uv, vec2<f32>(0.0), vec2<f32>(1.0)) * size), size - 1.0);
  // Round up only when BitmapLayer's truncation would address the previous texel.
  let firstCode = ceil(pixel * 4096.0 / size);
  return clamp(max(uv, firstCode / 4096.0), vec2<f32>(0.0), vec2<f32>(4095.0 / 4096.0));
}
`
};
