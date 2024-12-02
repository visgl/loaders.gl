// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {mat4} from '@math.gl/core';
import {Model, Geometry} from '@luma.gl/engine';

import {normalizeAttributes} from './normalize-attributes';

export function drawModelInViewport(model, viewport, uniforms = {}) {
  const {gl} = model;
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  viewport.width = gl.canvas.width;
  viewport.height = gl.canvas.height;
  gl.viewport(0, 0, viewport.width, viewport.height);

  uniforms.opacity = uniforms.opacity || 1;
  uniforms.projectionMatrix = getProjectionMatrix(viewport);
  uniforms.viewMatrix = getViewMatrix(viewport);
  model.draw({
    uniforms,
    parameters: {
      blend: true,
      blendFunc: [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA],
      depthTest: true,
      depthFunc: gl.LEQUAL
    }
  });
}

export function getModel(gl, data) {
  return new Model(gl, {
    id: 'mesh',
    vs: `
#define SHADER_NAME mesh-model-vs

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform int colorMode;
uniform float opacity;

attribute vec3 positions;
attribute vec4 colors;
attribute vec3 normals;
attribute vec2 texCoords;

varying vec4 vColor;

void main(void) {
  gl_Position = projectionMatrix * viewMatrix * vec4(positions, 1.0);
  if (colorMode == 0) {
    vColor = vec4(colors.rgb, colors.a * opacity) / 255.0;
  } else if (colorMode == 1) {
    vColor = vec4((normals + 1.0) / 2.0, opacity);
  } else {
    vColor = vec4(texCoords, 0.0, opacity);
  }
}
`,
    fs: `
#define SHADER_NAME mesh-model-fs

#ifdef gl_ES
precision highp float;
#endif

varying vec4 vColor;

void main(void) {
  gl_FragColor = vColor;
}
`,
    geometry: new Geometry({
      attributes: normalizeAttributes(data),
      drawMode: data.mode
    })
  });
}

function getViewMatrix({
  rotationX = 0,
  rotationZ = 0,
  zoom = 1,
  lookAt = [0, 0, 0],
  distance = 10
}) {
  const rotationMatrix = mat4.rotateX([], mat4.create(), (-rotationX / 180) * Math.PI);
  mat4.rotateZ(rotationMatrix, rotationMatrix, (-rotationZ / 180) * Math.PI);

  const translateMatrix = mat4.create();
  mat4.scale(translateMatrix, translateMatrix, [zoom, zoom, zoom]);
  mat4.translate(translateMatrix, translateMatrix, [-lookAt[0], -lookAt[1], -lookAt[2]]);

  const viewMatrix = mat4.lookAt([], [0, 0, distance], [0, 0, 0], [0, 1, 0]);
  mat4.multiply(
    viewMatrix,
    viewMatrix,
    mat4.multiply(rotationMatrix, rotationMatrix, translateMatrix)
  );

  return viewMatrix;
}

function getProjectionMatrix({width, height, near = 1, far = 100, fov = 50}) {
  return mat4.perspective([], (fov * Math.PI) / 180, width / height, near, far);
}
