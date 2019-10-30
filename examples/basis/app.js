/* global document, URL */
import {load} from '@loaders.gl/core';
import {BasisLoader, BasisFormat} from '@loaders.gl/basis';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.width = 768;
canvas.height = 512;
canvas.style.display = 'block';
const gl = canvas.getContext('webgl');
const dxtSupported = Boolean(gl.getExtension('WEBGL_compressed_texture_s3tc'));
const loadOptions = {format: BasisFormat.cTFRGB565};

if (dxtSupported) {
  loadOptions.format = {
    alpha: BasisFormat.cTFBC3,
    noAlpha: BasisFormat.cTFBC1
  };
}

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
  console.error(gl.getProgramInfoLog(program));
} else {
  gl.enableVertexAttribArray(0);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  gl.useProgram(program);
}

function renderTexture({width, height, format, decodedData}) {
  if (!dxtSupported) {
    // TODO: implement cTFRGB565 support
    return;
  }

  const ext = gl.getExtension('WEBGL_compressed_texture_s3tc');
  const glFormat = {
    [BasisFormat.cTFBC1]: ext.COMPRESSED_RGB_S3TC_DXT1_EXT,
    [BasisFormat.cTFBC3]: ext.COMPRESSED_RGBA_S3TC_DXT5_EXT
  }[format];

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.compressedTexImage2D(gl.TEXTURE_2D, 0, glFormat, width, height, 0, decodedData);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

const btn = document.createElement('button');
document.body.appendChild(btn);
btn.innerText = 'Load Basis File';

btn.addEventListener('click', e => {
  const el = document.createElement('input');
  el.type = 'file';
  el.addEventListener('input', async ev => {
    const url = URL.createObjectURL(ev.target.files[0]);
    const result = await load(url, BasisLoader, loadOptions);

    // eslint-disable-next-line
    console.log(result);
    renderTexture(result[0][0]);
  });
  el.click();
});
