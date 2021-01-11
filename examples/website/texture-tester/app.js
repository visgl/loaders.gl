/* eslint-disable react/no-unescaped-entities */
import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import TexturesBlock from './components/textures-block';
import {IMAGES_DATA} from './textures-data';

export default class App extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      canvas: null,
      gl: null,
      program: null
    };

    this.setupCanvas = this.setupCanvas.bind(this);
    this.createProgram = this.createProgram.bind(this);
    this.createAndFillBufferObject = this.createAndFillBufferObject.bind(this);
    this.renderTexturesBlocks = this.renderTexturesBlocks.bind(this);
    this.renderDescription = this.renderDescription.bind(this);
  }

  componentDidMount() {
    const canvas = this.setupCanvas();
    const gl = canvas.getContext('webgl');
    const program = this.createProgram(gl);

    this.setState({canvas, gl, program});
    this.createAndFillBufferObject(gl);
  }

  setupCanvas() {
    // eslint-disable-next-line no-undef
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
        <TexturesBlock
          key={index}
          gl={gl}
          canvas={canvas}
          program={program}
          blockName={formatName}
          images={images}
        />
      );
    });
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
