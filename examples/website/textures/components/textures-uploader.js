import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import React from 'react';
import styled from 'styled-components';
import { CompressedTexture } from './compressed-texture';
const Container = styled.div `
  display: flex;
  flex-flow: column nowrap;
`;
const TextureFrame = styled.div `
  display: flex;
  width: 256px;
  height: 256px;
  align-items: center;
  justify-content: center;
  border: 1px dashed black;
`;
const ImageContainer = styled.div `
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  width: 270px;
`;
export class TextureUploader extends React.PureComponent {
    static defaultProps = {
        canvas: null,
        model: null
    };
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
        this.setState({ uploadedImage: file });
        event.preventDefault();
    }
    handleCleanTexture() {
        this.setState({ uploadedImage: null });
    }
    render() {
        const { canvas, device, model } = this.props;
        const { uploadedImage, files } = this.state;
        return (_jsxs("div", { children: [!uploadedImage && (_jsxs(Container, { children: [_jsx(TextureFrame, { onDrop: this.handleLoadFile, onDragOver: (event) => event.preventDefault(), children: "Drag&Drop texture" }), _jsx("input", { style: { display: 'none' }, type: "file", id: "fileInput", files: files })] })), _jsxs(ImageContainer, { children: [uploadedImage && (_jsx(CompressedTexture, { image: uploadedImage, canvas: canvas, device: device, model: model })), uploadedImage && _jsx("button", { onClick: this.handleCleanTexture, children: "Clean" })] })] }));
    }
}
