import test from 'tape-promise/tape';

import {AnimationLoop, Model, CubeGeometry} from '@luma.gl/engine';

// import {SnapshotTestRunner} from '@luma.gl/test-utils';
import {clear} from '@luma.gl/webgl';

import {isBrowser} from '@loaders.gl/core';
import {VideoBuilder} from '@loaders.gl/video';

test('VideoBuilder#imports', (t) => {
  t.ok(VideoBuilder, 'VideoBuilder defined');
  t.end();
});

test('VideoBuilder#addFrame from canvas2d', async (t) => {
  if (!isBrowser) {
    t.end();
    return;
  }
  const canvas = document.createElement('canvas');
  const width = (canvas.width = 512);
  const height = (canvas.height = 512);

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ff0000';

  const videoBuilder = new VideoBuilder();
  await videoBuilder.initialize({width, height});

  for (let i = 0; i < 60; i++) {
    ctx.clearRect(0, 0, width, height);
    ctx.rect(i, i, 50, 50);
    ctx.fill();

    const imageData = ctx.getImageData(0, 0, width, height);
    const buffer = imageData.data.buffer;

    await videoBuilder.addFrame(buffer);
  }

  const videoDataUrl = await videoBuilder.finalize();
  t.ok(videoDataUrl, 'finalize() returns WebM video URL');

  // use Luma testUtils to check the video
  // const runner = new SnapshotTestRunner(t);
  // await runner.loadVideo(videoDataUrl);
  // await runner.takeSnapshot();

  t.end();
});

test('VideoBuilder#addFrame from webgl', async (t) => {
  if (!isBrowser) {
    t.end();
    return;
  }

  let model;
  const videoBuilder = new VideoBuilder();
  await videoBuilder.initialize({width: 800, height: 600});

  const loop = new AnimationLoop({
    // @ts-ignore
    onInitialize({gl}) {
      const vs = `\
        attribute vec3 positions;
        uniform float aspect;
        uniform float scale;
        uniform mat4 uMVP;
        void main(void) {
          gl_Position = vec4(
            positions.x * scale,
            positions.y * aspect,
            1.0,
            positions.y < 0.5 ? scale : 1.0
          );
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
        geometry: new CubeGeometry(),
        // @ts-ignore
        parameters: {
          depthWriteEnabled: true,
          depthCompare: 'less-equal'
        }
      });


      // Ideally we should initialize the videoBuilder with the same width and height as the canvas
      // but since `onInitialize` is async we need to set it up earlier

      // const [, , width, height] = gl.getParameter(gl.VIEWPORT);
      // videoBuilder.initialize({width, height});

      return {};
    },

    onRender({gl, framebuffer, aspect, tick}) {
      // eslint-disable-next-line camelcase
      model.setUniforms({scale: 2 + Math.cos(tick * 0.001), aspect});

      clear(gl, {color: [0, 0, 0, 1], depth: true});
      model.draw();

      const [, , width, height] = gl.getParameter(gl.VIEWPORT);

      const data = new Uint8Array(width * height * 4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
      videoBuilder.addFrame(data.buffer);
    },

    async onFinalize({gl}) {
      const videoDataUrl = await videoBuilder.finalize();
      model.destroy();
      t.ok(videoDataUrl, 'finalize() returns WebM video URL');
    }
  });

  loop.start();

  t.end();
});
