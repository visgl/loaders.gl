/* global document */
import {load, selectLoader} from '@loaders.gl/core';
import {BasisLoader, CompressedTextureLoader} from '@loaders.gl/textures';
import {ImageLoader} from '@loaders.gl/images';
import {instrumentGLContext, Program, Texture2D} from '@luma.gl/core';
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

// TEXTURE SHADERS

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

class TextureTesterApp {
  constructor(data) {
    this.data = data;

    this.canvas = this.setupCanvas();
    this.gl = this.canvas.getContext('webgl');
    instrumentGLContext(this.gl);

    this.supportedFormats = this.getSupportedFormats(this.gl);
    this.dxtSupported = false;
    this.pvrtcSupported = false;
    this.atcSupported = false;
    this.etc1Supported = false;
    this.loadOptions = {basis: {}};
  }

  async renderTextures() {
    const {gl} = this;
    const program = new Program(gl, {vs, fs});
    this.createAndFillBufferObject(gl, this.data);
    await this.loadTestTextures(gl, program.handle);
  }

  setupCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    return canvas;
  }

  createAndFillBufferObject(gl) {
    const data = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]);

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

  async loadTestTextures(gl, program) {
    const textures = document.querySelectorAll('.texture');

    if (this.supportedFormats.DXT) {
      this.loadOptions.basis.format = {
        alpha: 'BC3',
        noAlpha: 'BC1'
      };
    }

    for (const texture of textures) {
      await this.loadTexture(gl, texture, program);
    }
  }

  async loadTexture(gl, texElem, program) {
    const path = texElem.getAttribute('tex-src');

    try {
      const loader = await selectLoader(path, [CompressedTextureLoader, BasisLoader, ImageLoader]);
      const result = loader && (await load(path, loader, this.loadOptions));

      switch (loader && loader.name) {
        case 'CompressedTexture': {
          this.renderEmptyTexture(gl, program);
          this.renderCompressedTexture(gl, program, result, texElem, loader.name, path);
          break;
        }
        case 'Images': {
          this.renderEmptyTexture(gl, program);
          this.renderImageTexture(gl, program, result);
          break;
        }
        case 'Basis': {
          const basisTextures = result[0];
          this.renderEmptyTexture(gl, program);
          this.renderCompressedTexture(gl, program, basisTextures, texElem, loader.name, path);
          break;
        }
        default: {
          throw new Error('Unknown texture loader');
        }
      }
    } catch (error) {
      console.error(error); // eslint-disable-line
      this.renderErrorMessage(texElem, error.message);
    }

    const dataUrl = this.canvas.toDataURL();
    texElem.style.backgroundImage = `url(${dataUrl})`;
  }

  createCompressedTexture2D(gl, images) {
    const texture = new Texture2D(gl, {
      data: images,
      parameters: {
        [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
        [gl.TEXTURE_MIN_FILTER]: images.length > 1 ? gl.LINEAR_MIPMAP_NEAREST : gl.LINEAR,
        [gl.TEXTURE_WRAP_S]: gl.CLAMP_TO_EDGE,
        [gl.TEXTURE_WRAP_T]: gl.CLAMP_TO_EDGE
      }
    });

    return texture.handle;
  }

  createCompressedTexture(gl, images) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    for (let index = 0; index < images.length; ++index) {
      const image = images[index];
      const {width, height, format, data} = image;

      gl.compressedTexImage2D(gl.TEXTURE_2D, index, format, width, height, 0, data);
    }

    if (images.length > 1) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    return texture;
  }

  renderEmptyTexture(gl, program) {
    const brownColor = new Uint8Array([68, 0, 0, 255]);

    const lumaTexture = new Texture2D(gl, {
      width: 1,
      height: 1,
      data: brownColor,
      mipmaps: true,
      parameters: {
        [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
        [gl.TEXTURE_MIN_FILTER]: gl.LINEAR,
        [gl.TEXTURE_WRAP_S]: gl.CLAMP_TO_EDGE,
        [gl.TEXTURE_WRAP_T]: gl.CLAMP_TO_EDGE
      }
    });

    const texture = lumaTexture.handle;

    gl.useProgram(program);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Looks like formats can still be rendered, but presumably as converted textures...
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  renderImageTexture(gl, program, image) {
    const lumaTexture = new Texture2D(gl, {
      data: image,
      mipmaps: true,
      parameters: {
        [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
        [gl.TEXTURE_MIN_FILTER]: gl.LINEAR,
        [gl.TEXTURE_WRAP_S]: gl.CLAMP_TO_EDGE,
        [gl.TEXTURE_WRAP_T]: gl.CLAMP_TO_EDGE
      }
    });

    const texture = lumaTexture.handle;

    gl.useProgram(program);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // eslint-disable-next-line max-params
  renderCompressedTexture(gl, program, images, texElem, loaderName, texturePath) {
    if (!images || !images.length) {
      throw new Error(`${loaderName} loader doesn't support texture ${texturePath} format`);
    }

    if (!this.isFormatSupported(images[0].format)) {
      throw new Error(`Texture format ${images[0].format} not supported by this GPU`);
    }

    const texture = this.createCompressedTexture(gl, images);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.useProgram(program);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  renderErrorMessage(texElem, message) {
    const textNode = document.createElement('error-message');
    texElem.appendChild(textNode);

    textNode.innerHTML = message;
    textNode.style.fontSize = 'large';
    textNode.style.fontWight = 'bold';
    textNode.style.color = 'red';
  }

  getSupportedFormats(gl) {
    return {
      DXT: Boolean(gl.getExtension('WEBGL_compressed_texture_s3tc')),
      PVRTC: Boolean(gl.getExtension('WEBGL_compressed_texture_pvrtc')),
      ATC: Boolean(gl.getExtension('WEBGL_compressed_texture_atc')),
      ETC1: Boolean(gl.getExtension('WEBGL_compressed_texture_etc1'))
    };
  }

  // eslint-disable-next-line complexity
  isFormatSupported(format) {
    if (typeof format !== 'number') {
      throw new Error('Invalid internal format of compressed texture');
    }

    switch (format) {
      case COMPRESSED_RGB_S3TC_DXT1_EXT:
      case COMPRESSED_RGBA_S3TC_DXT3_EXT:
      case COMPRESSED_RGBA_S3TC_DXT5_EXT:
      case COMPRESSED_RGBA_S3TC_DXT1_EXT:
        return this.supportedFormats.DXT;

      case COMPRESSED_RGB_PVRTC_4BPPV1_IMG:
      case COMPRESSED_RGBA_PVRTC_4BPPV1_IMG:
      case COMPRESSED_RGB_PVRTC_2BPPV1_IMG:
      case COMPRESSED_RGBA_PVRTC_2BPPV1_IMG:
        return this.supportedFormats.PVRTC;

      case COMPRESSED_RGB_ATC_WEBGL:
      case COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL:
      case COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL:
        return this.supportedFormats.ATC;

      case COMPRESSED_RGB_ETC1_WEBGL:
        return this.supportedFormats.ETC1;

      default:
        return false;
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const testerApp = new TextureTesterApp();
  await testerApp.renderTextures();
});
