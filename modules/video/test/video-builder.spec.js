import test from 'tape-promise/tape';

import {AnimationLoop, Model, CubeGeometry} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';

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
  const width = canvas.width = 512;
  const height = canvas.height = 512;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ff0000';

  const videoBuilder = new VideoBuilder();
  videoBuilder.initialize({width, height});

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

  const eyePosition = [0, 0, 5];
  const mvpMatrix  = new Matrix4();
  const viewMatrix = new Matrix4().lookAt({eye: eyePosition});

  let buffer;
  let width;
  let height;
  const videoBuilder = new VideoBuilder();

  const loop = new AnimationLoop({
    onInitialize({gl}) {
      const vs = `\
        attribute vec3 positions;
        attribute vec2 texCoords;
        uniform mat4 uMVP;
        varying vec2 vUV;
        void main(void) {
          gl_Position = uMVP * vec4(positions, 1.0);
          vUV = texCoords;
        }
      `;

      const fs = `\
        precision highp float;
        uniform sampler2D uTexture;
        varying vec2 vUV;
        void main(void) {
          gl_FragColor = texture2D(uTexture, vec2(vUV.x, 1.0 - vUV.y));
        }
      `;

      const model = new Model(gl, {
        vs,
        fs,
        geometry: new CubeGeometry(),
        // @ts-ignore
        parameters: {
          depthWriteEnabled: true,
          depthCompare: 'less-equal',
        }
      });

      [, , width, height] = gl.getParameter(gl.VIEWPORT);

      buffer = new Uint8Array(width * height * 4);

      videoBuilder.initialize({width, height});

      return {model};
    },

    onRender({gl, model, aspect, tick}) {
      mvpMatrix
        .perspective({fov: Math.PI / 3, aspect})
        .multiplyRight(viewMatrix)
        .rotateX(tick * 0.01)
        .rotateY(tick * 0.013);
      model.setUniforms({uMVP: mvpMatrix});

      clear(gl, {color: [0, 0, 0, 1], depth: true});
      model.draw();

      // To @ibgreen: Should this use the framebuffer instead?
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, buffer);

      videoBuilder.addFrame(buffer);
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
