// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React from 'react';
// @ts-ignore Missing local type package in this standalone example.
import styled from 'styled-components';
import {Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {CompressedTexture} from './compressed-texture';

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

type TextureUploaderProps = {
  canvas: HTMLCanvasElement;
  device: Device;
  model: Model;
};

type TextureUploaderState = {
  uploadedImage: File | null;
};

export class TextureUploader extends React.PureComponent<
  TextureUploaderProps,
  TextureUploaderState
> {
  constructor(props: TextureUploaderProps) {
    super(props);

    this.state = {
      uploadedImage: null
    };

    this.handleLoadFile = this.handleLoadFile.bind(this);
    this.handleCleanTexture = this.handleCleanTexture.bind(this);
  }

  handleLoadFile(event: React.DragEvent<HTMLDivElement>) {
    const file = event.dataTransfer.files[0];
    this.setState({uploadedImage: file});
    event.preventDefault();
  }

  handleCleanTexture() {
    this.setState({uploadedImage: null});
  }

  render() {
    const {canvas, device, model} = this.props;
    const {uploadedImage} = this.state;

    return (
      <div>
        {!uploadedImage && (
          <Container>
            <TextureFrame
              onDrop={this.handleLoadFile}
              onDragOver={(event: React.DragEvent<HTMLDivElement>) => event.preventDefault()}
            >
              Drag&Drop texture
            </TextureFrame>
            <input style={{display: 'none'}} type="file" id="fileInput" />
          </Container>
        )}
        <ImageContainer>
          {uploadedImage && (
            <CompressedTexture
              image={uploadedImage}
              canvas={canvas}
              device={device}
              model={model}
            />
          )}
          {uploadedImage && <button onClick={this.handleCleanTexture}>Clean</button>}
        </ImageContainer>
      </div>
    );
  }
}
