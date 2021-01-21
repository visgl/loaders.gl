/* eslint-disable react/no-unescaped-entities */
import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import {instrumentGLContext, Program} from '@luma.gl/core';
import {IMAGES_DATA} from './textures-data';
import CompressedTexture from './components/compressed-texture';
import TextureUploader from './components/textures-uploader';

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

export default class App extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      canvas: null,
      gl: null,
      program: null
    };
  }

  componentDidMount() {
    const canvas = this.setupCanvas();
    const gl = canvas.getContext('webgl');
    instrumentGLContext(gl);
    this.createAndFillBufferObject(gl);
    const program = new Program(gl, {vs, fs});

    this.setState({canvas, gl, program: program.handle});
  }

  setupCanvas() {
    // eslint-disable-next-line no-undef
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

  renderTexturesBlocks() {
    const {canvas, gl, program} = this.state;

    return IMAGES_DATA.map((imagesData, index) => {
      return (
        <div key={index}>
          {this.renderTexturesHeader(imagesData)}
          {this.renderTextures(gl, canvas, program, imagesData.images)}
          {this.renderTexturesDescription(imagesData)}
        </div>
      );
    });
  }

  renderTexturesHeader(imagesData) {
    const {formatName, link} = imagesData;

    return (
      <div style={{display: 'flex', flexFlow: 'column'}}>
        <h2 style={{borderBottom: '1px solid black', marginBottom: 0}}>
          {link ? (
            <a style={{textDecoration: 'none'}} href={link}>
              {formatName}
            </a>
          ) : (
            formatName
          )}
        </h2>
      </div>
    );
  }

  renderTexturesDescription(imagesData) {
    const {description, codeSample, availability} = imagesData;
    return (
      <div>
        {description && (
          <p>
            <b>{'Description: '}</b>
            {description}
          </p>
        )}
        {availability && (
          <p>
            <b>{'Availability: '}</b>
            {availability}
          </p>
        )}
        {codeSample && (
          <div>
            <p>
              <code>{codeSample}</code>
            </p>
          </div>
        )}
      </div>
    );
  }

  renderTextures(gl, canvas, program, images) {
    return images.map((image, index) => (
      <CompressedTexture key={index} image={image} canvas={canvas} gl={gl} program={program} />
    ));
  }

  renderDescription() {
    return (
      <div>
        <h1>Texture Loaders</h1>
        <p>
          This page loads every &nbsp;
          <a href="https://loaders.gl/modules/textures/docs/using-compressed-textures">
            texture format
          </a>{' '}
          &nbsp; supported by loaders.gl and attempts to display them in WebGL using the{' '}
          <a href="https://luma.gl">
            <b>luma.gl</b>
          </a>{' '}
          <code>Texture2D</code> class.
        </p>
        <p>
          The <code>@loaders.gl/textures</code> &nbsp; module provides loaders for compressed
          textures stored in <b>KTX</b>, <b>DDS</b> and <b>PVR</b> container files, plus <b>CRN</b>{' '}
          (Crunch), and <b>Basis</b> supercompressed textures.
        </p>
        <p>This page also shows which compressed texture types your device and browser supports.</p>
        <p>
          <i>
            Note that multiple textures on this page will fail to display due to lack of GPU support
            (reported via WebGL extensions). For example: DXT formats are usually only supported on
            Desktops while PVRTC is typically only available on mobile devices with PowerVR
            chipsets.
          </i>
        </p>
        <p>
          <i>
            Inspired by toji's awesome{' '}
            <a href="http://toji.github.io/texture-tester">texture-tester</a>
          </i>
        </p>
      </div>
    );
  }

  render() {
    const {gl, canvas, program} = this.state;
    return (
      <div style={{margin: 30}}>
        {this.renderDescription()}
        {gl && <TextureUploader canvas={canvas} gl={gl} program={program} />}
        {gl && this.renderTexturesBlocks()}
      </div>
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
