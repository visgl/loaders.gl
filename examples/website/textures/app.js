/* eslint-disable react/no-unescaped-entities */
import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import styled from 'styled-components';
import {instrumentGLContext, Program} from '@luma.gl/core';
import {IMAGES_DATA} from './textures-data';
import CompressedTexture from './components/compressed-texture';

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

const Header = styled.h2`
  border-bottom: 1px solid black;
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
      const {formatName, images} = imagesData;

      return (
        <div key={index}>
          <Header>{formatName}</Header>
          {this.renderTextures(gl, canvas, program, images)}
        </div>
      );
    });
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
          <i>
            Inspired by toji's <a href="http://toji.github.io/texture-tester">texture-tester</a>
          </i>
        </p>
        <p>
          This page loads every texture format supported by loaders.gl and attempts to display them
          in WebGL using the{' '}
          <a href="https://luma.gl">
            <b>luma.gl</b>
          </a>{' '}
          <code>Texture2D</code> class. It demonstrates working code for using loaders.gl to load
          compressed textures, and also shows which formats your browser/device supports.
        </p>
        <p>
          <i>
            Note: It is expected that multiple textures on this page will fail to display due to
            lack of GPU support. (For example: DXT formats are usually only supported on Desktops
            while PVRTC is typically only available on mobile devices with PowerVR chipsets.) Your
            hardware may support other formats beyond what is shown here, but only the following
            formats have had WebGL extensions specified for their use.
          </i>
        </p>
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.renderDescription()}
        {this.state.gl && this.renderTexturesBlocks()}
      </div>
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
