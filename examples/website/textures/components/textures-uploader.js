import React, {PureComponent} from 'react';
import styled from 'styled-components';
import CompressedTexture from './compressed-texture';
import PropTypes from 'prop-types';

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;

const TextureFrame = styled.div`
  display: flex;
  width: 256px;
  height: 256px;
  align-items: center;
  justify-content: center;
  border: 1px dashed black;
`;

const ImageContainer = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  width: 270px;
`;

const propTypes = {
  canvas: PropTypes.object,
  gl: PropTypes.object,
  program: PropTypes.object
};

const defaultProps = {
  canvas: null,
  gl: null,
  program: null
};

export default class TextureUploader extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      uploadedImage: null
    };

    this.handleLoadFile = this.handleLoadFile.bind(this);
    this.handleCleanTexture = this.handleCleanTexture.bind(this);
  }

  handleLoadFile(event) {
    const file = event.dataTransfer.files[0];
    this.setState({uploadedImage: file});
    event.preventDefault();
  }

  handleCleanTexture() {
    this.setState({uploadedImage: null});
  }

  render() {
    const {canvas, gl, program} = this.props;
    const {uploadedImage, files} = this.state;

    return (
      <div>
        {!uploadedImage && (
          <Container>
            <TextureFrame onDrop={this.handleLoadFile} onDragOver={event => event.preventDefault()}>
              Drag&Drop texture
            </TextureFrame>
            <input style={{display: 'none'}} type="file" id="fileInput" files={files} />
          </Container>
        )}
        <ImageContainer>
          {uploadedImage && (
            <CompressedTexture image={uploadedImage} canvas={canvas} gl={gl} program={program} />
          )}
          {uploadedImage && <button onClick={this.handleCleanTexture}>Clean</button>}
        </ImageContainer>
      </div>
    );
  }
}

TextureUploader.propTypes = propTypes;
TextureUploader.defaultProps = defaultProps;
