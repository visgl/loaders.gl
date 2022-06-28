import test from 'tape-promise/tape';

import {AnimationLoop, Model, CubeGeometry} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';

import {clear} from '@luma.gl/webgl';

import {isBrowser} from '@loaders.gl/core';
import {WebMVideoBuilder} from '@loaders.gl/video';

test('WebMVideoBuilder#imports', (t) => {
  t.ok(WebMVideoBuilder, 'WebMVideoBuilder defined');
  t.end();
});

test('WebMVideoBuilder#addFrame from canvas2d', async (t) => {
  if (!isBrowser) {
    t.end();
    return;
  }
  const canvas = document.createElement('canvas');
  const width = (canvas.width = 512);
  const height = (canvas.height = 512);

  const ctx = canvas.getContext('2d');

  // Appease Typescript
  if (!ctx) return;

  ctx.fillStyle = '#ff0000';

  const videoBuilder = new WebMVideoBuilder();
  await videoBuilder.initialize({width, height});

  for (let i = 0; i < 60; i++) {
    ctx.clearRect(0, 0, width, height);
    ctx.rect(i, i, 50, 50);
    ctx.fill();

    await videoBuilder.addFrame(ctx);
  }

  const videoDataUrl = await videoBuilder.finalize();
  t.ok(videoDataUrl, 'finalize() returns WebM video URL');

  t.end();
});

test('WebMVideoBuilder#addFrame from webgl', async (t) => {
  if (!isBrowser) {
    t.end();
    return;
  }

  const eyePosition = [0, 0, 5];
  const mvpMatrix  = new Matrix4();
  const viewMatrix = new Matrix4().lookAt({eye: eyePosition});

  let model;
  const videoBuilder = new WebMVideoBuilder();
  await videoBuilder.initialize({width: 800, height: 600});

  const loop = new AnimationLoop({
    onInitialize(props) {
      const {gl} = props;
      const vs = `\
        attribute vec3 positions;
        uniform mat4 uMVP;
        void main(void) {
          gl_Position = uMVP * vec4(positions, 1.0);
        }
      `;

      const fs = `\
        precision highp float;
        void main(void) {
          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
      `;

      model = new Model(gl, {
        vs,
        fs,
        geometry: new CubeGeometry()
      });

      return props;
    },

    onRender({gl, aspect, tick}) {
      mvpMatrix
        .perspective({fov: Math.PI / 3, aspect})
        .multiplyRight(viewMatrix)
        .rotateX(tick * 0.01)
        .rotateY(tick * 0.013);
      model.setUniforms({uMVP: mvpMatrix});

      clear(gl, {color: [0, 0, 0, 1], depth: true});
      model.draw();

      videoBuilder.addFrame(gl);

      if (tick > 120) {
        loop.delete();
      }
    },

    async onFinalize({gl}) {
      const videoDataUrl = await videoBuilder.finalize();
      t.ok(videoDataUrl, 'finalize() returns WebM video URL');
    }
  });

  loop.start();

  t.end();
});
