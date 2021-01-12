import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import CompressedTexture from './texture';

const Header = styled.h2`
  border-bottom: 1px solid black;
`;

const propTypes = {
  gl: PropTypes.object,
  canvas: PropTypes.object,
  program: PropTypes.object,
  blockName: PropTypes.string,
  images: PropTypes.array
};

const defaultProps = {
  gl: null,
  canvas: null,
  program: null,
  blockName: 'Texture format',
  images: []
};

export default class TexturesBlock extends PureComponent {
  constructor(props) {
    super(props);

    this.renderTextures = this.renderTextures.bind(this);
  }

  renderTextures(gl, canvas, program, images) {
    return images.map((image, index) => (
      <CompressedTexture key={index} image={image} canvas={canvas} gl={gl} program={program} />
    ));
  }

  render() {
    const {gl, canvas, program, images, blockName} = this.props;

    return (
      <div>
        <Header>{blockName}</Header>
        {this.renderTextures(gl, canvas, program, images)}
      </div>
    );
  }
}

TexturesBlock.propTypes = propTypes;
TexturesBlock.defaultProps = defaultProps;
