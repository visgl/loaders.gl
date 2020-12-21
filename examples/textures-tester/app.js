/* global document */
import {load} from '@loaders.gl/core';
import {BasisLoader, _CompressedTextureLoader} from '@loaders.gl/basis';
import {ImageLoader} from '@loaders.gl/images';

const canvas = document.createElement('canvas');
canvas.width = 256;
canvas.height = 256;
canvas.style.display = 'block';

const gl = canvas.getContext('webgl');

const loadOptions = {basis: {}, image: {decode: true, type: 'image'}};

// TODO - build in auto detection of supported formats into `BasisLoader`
const dxtSupported = Boolean(gl.getExtension('WEBGL_compressed_texture_s3tc'));
if (dxtSupported) {
  loadOptions.basis.format = {
    alpha: 'BC3',
    noAlpha: 'BC1'
  };
}

const textureRenderPogram = createProgram();

document.addEventListener('DOMContentLoaded', async () => await loadTextures());

async function loadTextures() {
  const textures = document.querySelectorAll('.texture');
  for (let index = 0; index < textures.length; index++) {
    await loadTexture(textures[index]);
  }
}

async function loadTexture(texElem) {
  const path = texElem.getAttribute('tex-src');
  const result = await load(
    path,
    [BasisLoader, ImageLoader, _CompressedTextureLoader],
    loadOptions
  );
  let image = null;

  if (!result) {
    renderNotSupportedTexture();
  } else if (result[0]) {
    image = result[0][0];
  } else {
    image = result;
  }

  renderTexture(textureRenderPogram, image);
  const dataUrl = canvas.toDataURL();
  texElem.style.backgroundImage = `url(${dataUrl})`;
}

// TODO Implement handling different images types after loading!
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

  try {
    const {width, height, compressed, format, data} = image;
    if (compressed) {
      gl.compressedTexImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, data);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    }
  } catch (e) {
    console.error('Error', e); // eslint-disable-line
    renderNotSupportedTexture();
  }

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function renderNotSupportedTexture() {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([68, 0, 0, 255])
  );
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
