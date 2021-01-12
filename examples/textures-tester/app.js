/* eslint-disable max-params */
/* eslint-disable complexity */
/* global document */
import {load, selectLoader} from '@loaders.gl/core';
import {BasisLoader, _CompressedTextureLoader, CrunchLoader} from '@loaders.gl/textures';
import {ImageLoader} from '@loaders.gl/images';
import {
  COMPRESSED_RGB_S3TC_DXT1_EXT,
  COMPRESSED_RGBA_S3TC_DXT1_EXT,
  COMPRESSED_RGBA_S3TC_DXT3_EXT,
  COMPRESSED_RGBA_S3TC_DXT5_EXT,
  COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
  COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
  COMPRESSED_RGB_PVRTC_2BPPV1_IMG,
  COMPRESSED_RGBA_PVRTC_2BPPV1_IMG,
  COMPRESSED_RGB_ATC_WEBGL,
  COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL,
  COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL,
  COMPRESSED_RGB_ETC1_WEBGL
} from './constants';

class TextureTesterApp {
  constructor(data) {
    this.data = data;
    this.dxtSupported = false;
    this.pvrtcSupported = false;
    this.atcSupported = false;
    this.etc1Supported = false;
    this.loadOptions = {basis: {}, image: {decode: true, type: 'image'}};
  }

  async renderTextures() {
    const canvas = this.setupCanvas();
    const gl = canvas.getContext('webgl');
    this.setupSupportedFormats(gl);
    const program = this.createProgram(gl);
    this.createAndFillBufferObject(gl, this.data);

    await this.loadTestTextures(canvas, gl, this.loadOptions, program);
  }

  setupCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    return canvas;
  }

  createProgram(gl) {
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

    return program;
  }

  setupSupportedFormats(gl) {
    this.dxtSupported = Boolean(gl.getExtension('WEBGL_compressed_texture_s3tc'));
    this.pvrtcSupported = Boolean(gl.getExtension('WEBGL_compressed_texture_pvrtc'));
    this.atcSupported = Boolean(gl.getExtension('WEBGL_compressed_texture_atc'));
    this.etc1Supported = Boolean(gl.getExtension('WEBGL_compressed_texture_etc1'));
  }

  createAndFillBufferObject(gl, data) {
    const startingArrayIndex = 0;
    const bufferId = gl.createBuffer();

    if (!bufferId) {
      console.error('Failed to create the buffer object'); // eslint-disable-line
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.enableVertexAttribArray(startingArrayIndex);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.vertexAttribPointer(startingArrayIndex, 2, gl.FLOAT, false, 0, 0);
  }

  async loadTestTextures(canvas, gl, loadOptions, program) {
    const textures = document.querySelectorAll('.texture');

    for (const texture of textures) {
      await this.loadTexture(canvas, gl, texture, loadOptions, program);
    }
  }

  async loadTexture(canvas, gl, texElem, loadOptions, program) {
    const path = texElem.getAttribute('tex-src');

    try {
      const loader = await selectLoader(path, [
        _CompressedTextureLoader,
        CrunchLoader,
        BasisLoader,
        ImageLoader
      ]);
      const result = await load(path, loader, loadOptions);

      switch (loader.name) {
        case 'Crunch':
        case 'CompressedTexture': {
          this.renderCompresedTexture(gl, program, result, texElem, loader.name, path);
          break;
        }
        case 'Images': {
          this.renderImageTexture(gl, program, result);
          break;
        }
        case 'Basis': {
          const basisTextures = result[0];
          this.renderCompresedTexture(gl, program, basisTextures, texElem, loader.name, path);
          break;
        }
        default: {
          this.renderTextureError(gl, program, texElem, 'No available loader for this texture');
        }
      }
    } catch (error) {
      console.error(error); // eslint-disable-line
      this.renderTextureError(gl, program, texElem, error);
    }

    const dataUrl = canvas.toDataURL();
    texElem.style.backgroundImage = `url(${dataUrl})`;
  }

  renderImageTexture(gl, program, image) {
    gl.useProgram(program);
    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 8);
  }

  renderCompresedTexture(gl, program, images, texElem, loaderName, texturePath) {
    if (!images || !images.length) {
      throw new Error(`${loaderName} loader doesn't support texture ${texturePath} format`);
    }

    if (this.dxtSupported) {
      this.loadOptions.basis.format = {
        alpha: 'BC3',
        noAlpha: 'BC1'
      };
    }

    if (!this.isFormatSupported(images[0].format)) {
      throw new Error('Texture format not supported');
    }

    gl.useProgram(program);
    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    try {
      for (let index = 0; index < images.length; ++index) {
        const image = images[index];
        const {width, height, format, data} = image;

        gl.compressedTexImage2D(gl.TEXTURE_2D, index, format, width, height, 0, data);
      }
    } catch (error) {
      console.error(error); // eslint-disable-line
      this.renderTextureError(gl, program, texElem, error);
    }

    if (images.length > 1) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  renderTextureError(gl, program, texElem, message) {
    gl.useProgram(program);
    const texture = gl.createTexture();
    const brownColor = new Uint8Array([68, 0, 0, 255]);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, brownColor); // eslint-disable-line
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 8);
    this.renderErrorMessage(texElem, message);
  }

  renderErrorMessage(texElem, message) {
    texElem.innerHTML = message;
    texElem.style.color = 'red';
    texElem.style.fontSize = 16;
  }

  isFormatSupported(format) {
    if (typeof format !== 'number') {
      throw new Error('Invalid internal format of compressed texture');
    }

    switch (format) {
      case COMPRESSED_RGB_S3TC_DXT1_EXT:
      case COMPRESSED_RGBA_S3TC_DXT3_EXT:
      case COMPRESSED_RGBA_S3TC_DXT5_EXT:
      case COMPRESSED_RGBA_S3TC_DXT1_EXT:
        return this.dxtSupported;

      case COMPRESSED_RGB_PVRTC_4BPPV1_IMG:
      case COMPRESSED_RGBA_PVRTC_4BPPV1_IMG:
      case COMPRESSED_RGB_PVRTC_2BPPV1_IMG:
      case COMPRESSED_RGBA_PVRTC_2BPPV1_IMG:
        return this.pvrtcSupported;

      case COMPRESSED_RGB_ATC_WEBGL:
      case COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL:
      case COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL:
        return this.atcSupported;

      case COMPRESSED_RGB_ETC1_WEBGL:
        return this.etc1Supported;

      default:
        return false;
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const data = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]);
  const testerApp = new TextureTesterApp(data);
  await testerApp.renderTextures();
});
