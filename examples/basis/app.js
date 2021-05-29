import {load} from '@loaders.gl/core';
import {BasisLoader} from '@loaders.gl/textures';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.width = 768;
canvas.height = 512;
canvas.style.display = 'block';

const gl = canvas.getContext('webgl');

const loadOptions = {basis: {}};

// TODO - build in auto detection of supported formats into `BasisLoader`
const dxtSupported = Boolean(gl.getExtension('WEBGL_compressed_texture_s3tc'));
if (dxtSupported) {
  loadOptions.basis.format = {
    alpha: 'BC3',
    noAlpha: 'BC1'
  };
}

// TODO - load images from github once the test images have been pushed to repo
// const BASIS_URL =
//   'https://raw.githubusercontent.com/uber-web/loaders.gl/master/modules/textures/test/data/alpha.3.basis';

const textureRenderPogram = createProgram();

const btn = document.createElement('button');
document.body.appendChild(btn);
btn.innerText = 'Load Basis File';

btn.addEventListener('click', e => {
  const el = document.createElement('input');
  el.type = 'file';
  el.addEventListener('input', async ev => {
    const result = await load(ev.target.files[0], BasisLoader, loadOptions);
    const image = result[0][0];
    console.log(image); // eslint-disable-line
    renderTexture(textureRenderPogram, image);
  });

  el.click();
});

function renderTexture(program, image) {
  gl.useProgram(program);

  if (!dxtSupported) {
    // TODO: implement cTFRGB565 support
    return;
  }

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const {width, height, compressed, format, data} = image;
  if (compressed) {
    gl.compressedTexImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, data);
  }

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function createProgram() {
  const vs = `
  precision highp float;

  attribute vec2 position;
  varying vec2 uv;

  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
    uv = vec2(position.x * .5, -position.y * .5) + vec2(.5, .5);
  }
  `;

  const fs = `
  precision highp float;

  uniform sampler2D tex;
  varying vec2 uv;

  void main() {
    gl_FragColor = vec4(texture2D(tex, uv).rgb, 1.);
  }
  `;

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vs);
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fs);
  gl.compileShader(fragmentShader);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    // eslint-disable-next-line
    throw new Error(gl.getProgramInfoLog(program));
  }

  gl.enableVertexAttribArray(0);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  return program;
}
