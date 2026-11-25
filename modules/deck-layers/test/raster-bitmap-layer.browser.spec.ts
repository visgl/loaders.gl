// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Deck, OrthographicView} from '@deck.gl/core';
import {expect, test} from 'vitest';
import {getRasterUploadData, RasterBitmapLayer} from '../src/raster-bitmap-layer';
import {rasterBitmapUniforms, rasterTextureLayout} from '../src/raster-bitmap-layer-shaders';

test('picks adjacent texels of an 8192 x 1 raster on WebGL', async () => {
  const data = new Uint16Array(8192);
  data.set([17, 28, 39]);
  const layer = new RasterBitmapLayer({
    raster: {width: data.length, height: 1, data},
    bounds: [0, -2, data.length, 2],
    pickable: true
  });
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 4;
  document.body.append(canvas);
  const rendered = Promise.withResolvers<void>();
  const deck = new Deck({
    canvas,
    width: canvas.width,
    height: canvas.height,
    useDevicePixels: false,
    views: new OrthographicView(),
    viewState: {target: [4, 0, 0], zoom: 0},
    layers: [layer],
    onAfterRender: () => rendered.resolve(),
    onError: rendered.reject
  });
  try {
    await rendered.promise;
    for (const [column, value] of data.subarray(0, 3).entries()) {
      expect(deck.pickObject({x: column, y: 2})).toMatchObject({
        picked: true,
        bitmap: {pixel: [column, 0]},
        value
      });
    }
  } finally {
    deck.finalize();
    canvas.remove();
  }
});

test('packs exact columns of an 8192 x 1 texture in WGSL', async ({skip}) => {
  const adapter = await navigator.gpu?.requestAdapter();
  if (!adapter || adapter.limits.maxTextureDimension2D < 8192) {
    skip('WebGPU with 8192-wide textures is unavailable');
    return;
  }

  const device = await adapter.requestDevice();
  try {
    const source = rasterBitmapUniforms
      .source!.replace('@binding(auto)', '@binding(0)')
      .replace('@binding(auto)', '@binding(1)');
    const shader = device.createShaderModule({
      code: `${source}
@group(0) @binding(2) var<storage, read_write> colors: array<vec4<f32>, 4>;

@compute @workgroup_size(1)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let column = select(invocation.x, 8191u, invocation.x == 3u);
  let uv = vec2<f32>((f32(column) + 0.5) / 8192.0, 0.5);
  colors[invocation.x] = vec4<f32>(raster_pickingColor(uv), 1.0);
}`
    });
    const pipeline = await device.createComputePipelineAsync({
      layout: 'auto',
      compute: {module: shader, entryPoint: 'main'}
    });
    const uniformBuffer = device.createBuffer({
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    // pickingRowStride follows seven f32 values in RasterBitmapUniforms.
    device.queue.writeBuffer(uniformBuffer, 28, new Uint32Array([8192]));
    const texture = device.createTexture({
      size: [8192, 1],
      format: 'r32float',
      usage: GPUTextureUsage.TEXTURE_BINDING
    });
    const outputSize = 4 * 4 * Float32Array.BYTES_PER_ELEMENT;
    const output = device.createBuffer({
      size: outputSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });
    const readback = device.createBuffer({
      size: outputSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
    });
    const bindings = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: {buffer: uniformBuffer}},
        {binding: 2, resource: {buffer: output}},
        {binding: rasterTextureLayout.bindings[0].location, resource: texture.createView()}
      ]
    });
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindings);
    pass.dispatchWorkgroups(4);
    pass.end();
    encoder.copyBufferToBuffer(output, 0, readback, 0, outputSize);
    device.queue.submit([encoder.finish()]);
    await readback.mapAsync(GPUMapMode.READ);
    const bytes = Array.from(new Float32Array(readback.getMappedRange()), channel =>
      Math.round(channel * 255)
    );
    expect(bytes).toEqual([0, 0, 0, 255, 1, 0, 0, 255, 2, 0, 0, 255, 255, 31, 0, 255]);
  } finally {
    device.destroy();
  }
});

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
    // interpolateColormap, then pickingRowStride (uint, unused here). Use nearest sampling.
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
