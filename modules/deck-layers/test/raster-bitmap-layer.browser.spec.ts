// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getRasterUploadData} from '../src/raster-bitmap-layer';
import {rasterBitmapUniforms} from '../src/raster-bitmap-layer-shaders';

test('raster_sample renders a valid texel next to a Uint32 sentinel that rounds to the same float32', () => {
  const raster = {width: 2, height: 1, data: new Uint32Array([16777216, 16777217])};
  const noData = 16777217;
  const upload = getRasterUploadData(raster, noData);
  const canvas = document.createElement('canvas');
  canvas.width = raster.width;
  canvas.height = raster.height;
  const context = canvas.getContext('webgl2', {antialias: false});
  if (!context) {
    throw new Error('WebGL2 is required to test raster sampling');
  }

  try {
    const program = context.createProgram()!;
    const vertexShader = compileShader(
      context,
      context.VERTEX_SHADER,
      `#version 300 es
const vec2 corners[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() {
  gl_Position = vec4(corners[gl_VertexID], 0.0, 1.0);
}`
    );
    const fragmentShader = compileShader(
      context,
      context.FRAGMENT_SHADER,
      `#version 300 es
precision highp float;
${rasterBitmapUniforms.fs}
out vec4 color;
void main() {
  color = raster_sample(gl_FragCoord.xy / vec2(2.0, 1.0));
}`
    );
    context.attachShader(program, vertexShader);
    context.attachShader(program, fragmentShader);
    context.linkProgram(program);
    expect(
      context.getProgramParameter(program, context.LINK_STATUS),
      context.getProgramInfoLog(program) ?? ''
    ).toBe(true);
    context.useProgram(program);

    const uniformBuffer = context.createBuffer();
    context.bindBuffer(context.UNIFORM_BUFFER, uniformBuffer);
    // std140 order: valueRange, noData, useNoData, valueScale, linearInterpolation,
    // interpolateColormap, then padding. Use nearest sampling at the texel centers.
    const uniforms = new Float32Array([
      16777216,
      16777218,
      noData,
      Number(upload.useNoData),
      0,
      0,
      0,
      0
    ]);
    context.bufferData(context.UNIFORM_BUFFER, uniforms, context.STATIC_DRAW);
    const uniformBlock = context.getUniformBlockIndex(program, 'rasterBitmapUniforms');
    context.uniformBlockBinding(program, uniformBlock, 0);
    context.bindBufferBase(context.UNIFORM_BUFFER, 0, uniformBuffer);

    bindTexture(context, program, 'rasterTexture', 0);
    context.texImage2D(
      context.TEXTURE_2D,
      0,
      context.R32F,
      2,
      1,
      0,
      context.RED,
      context.FLOAT,
      upload.data
    );
    bindTexture(context, program, 'rasterColormap', 1);
    const dataColor = [32, 96, 160, 255];
    const colormap = new Uint8Array(256 * 4);
    colormap.set(dataColor);
    context.texImage2D(
      context.TEXTURE_2D,
      0,
      context.RGBA8,
      256,
      1,
      0,
      context.RGBA,
      context.UNSIGNED_BYTE,
      colormap
    );

    context.drawArrays(context.TRIANGLES, 0, 3);
    const pixels = new Uint8Array(2 * 4);
    context.readPixels(0, 0, 2, 1, context.RGBA, context.UNSIGNED_BYTE, pixels);
    expect(context.getError()).toBe(context.NO_ERROR);
    expect(pixels).toEqual(new Uint8Array([...dataColor, 0, 0, 0, 0]));
  } finally {
    context.getExtension('WEBGL_lose_context')?.loseContext();
  }
});

/** Compiles the test vertex shader or production raster fragment shader. */
function compileShader(context: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = context.createShader(type)!;
  context.shaderSource(shader, source);
  context.compileShader(shader);
  expect(
    context.getShaderParameter(shader, context.COMPILE_STATUS),
    context.getShaderInfoLog(shader) ?? ''
  ).toBe(true);
  return shader;
}

/** Binds an unfiltered texture to a sampler in the test program. */
function bindTexture(
  context: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
  unit: number
): void {
  context.activeTexture(context.TEXTURE0 + unit);
  context.bindTexture(context.TEXTURE_2D, context.createTexture());
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
  context.uniform1i(context.getUniformLocation(program, name), unit);
}
