import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { luma } from '@luma.gl/core';
import { webgl2Adapter } from '@luma.gl/webgl';
import { IMAGES_DATA } from './textures-data';
import { CompressedTexture, createModel } from './components/compressed-texture';
import { TextureUploader } from './components/textures-uploader';
export default class App extends React.PureComponent {
    device;
    constructor(props) {
        super(props);
        this.state = {
            canvas: null,
            device: null,
            model: null
        };
    }
    async componentDidMount() {
        // eslint-disable-next-line no-undef
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const device = await luma.createDevice({
            adapters: [webgl2Adapter],
            createCanvasContext: { canvas },
            type: 'webgl'
        });
        const model = createModel(device);
        // eslint-disable-next-line react/no-did-mount-set-state
        this.setState({ canvas, device, model });
    }
    render() {
        const { device, canvas, model } = this.state;
        if (!device) {
            return _jsx("div", {});
        }
        return (_jsxs("div", { style: { margin: 30 }, children: [_jsx(Description, {}), device && _jsx(TextureUploader, { canvas: canvas, device: device, model: model }), device && _jsx(TexturesBlocks, { canvas: canvas, device: device, model: model })] }));
    }
}
function TexturesBlocks(props) {
    const { device, canvas, model } = props;
    return IMAGES_DATA.map((imagesData, index) => {
        return (_jsxs("div", { children: [_jsx(TexturesHeader, { imagesData: imagesData }), _jsx(TexturesList, { device: device, canvas: canvas, model: model, images: imagesData.images }), _jsx(TexturesDescription, { imagesData: imagesData })] }, index));
    });
}
function TexturesHeader(props) {
    const { formatName, link } = props.imagesData;
    return (_jsx("div", { style: { display: 'flex', flexFlow: 'column' }, children: _jsx("h2", { style: { borderBottom: '1px solid black', marginBottom: 0 }, children: link ? (_jsx("a", { style: { textDecoration: 'none' }, href: link, children: formatName })) : (formatName) }) }));
}
function TexturesDescription(props) {
    const { description, codeSample, availability } = props.imagesData;
    return (_jsxs("div", { children: [description && (_jsxs("p", { children: [_jsx("b", { children: 'Description: ' }), description] })), availability && (_jsxs("p", { children: [_jsx("b", { children: 'Availability: ' }), availability] })), codeSample && (_jsx("div", { children: _jsx("p", { children: _jsx("code", { children: codeSample }) }) }))] }));
}
function TexturesList(props) {
    const { device, canvas, model, images } = props;
    return images.map((image, index) => (_jsx(CompressedTexture, { image: image, device: device, canvas: canvas, model: model }, index)));
}
function Description() {
    return (_jsxs("div", { children: [_jsx("h1", { children: "Texture Loaders" }), _jsxs("p", { children: ["This page loads every \u00A0", _jsx("a", { href: "https://loaders.gl/modules/textures/docs/using-compressed-textures", children: "texture format" }), ' ', "\u00A0 supported by loaders.gl and attempts to display them in WebGL using the", ' ', _jsx("a", { href: "https://luma.gl", children: _jsx("b", { children: "luma.gl" }) }), ' ', _jsx("code", { children: "Texture2D" }), " class."] }), _jsxs("p", { children: ["The ", _jsx("code", { children: "@loaders.gl/textures" }), " \u00A0 module provides loaders for compressed textures stored in ", _jsx("b", { children: "KTX" }), ", ", _jsx("b", { children: "DDS" }), " and ", _jsx("b", { children: "PVR" }), " container files, plus ", _jsx("b", { children: "CRN" }), " (Crunch), and ", _jsx("b", { children: "Basis" }), " supercompressed textures."] }), _jsx("p", { children: "This page also shows which compressed texture types your device and browser supports." }), _jsx("p", { children: _jsx("i", { children: "Note that multiple textures on this page will fail to display due to lack of GPU support (reported via WebGL extensions). For example: DXT formats are usually only supported on Desktops while PVRTC is typically only available on mobile devices with PowerVR chipsets." }) }), _jsx("p", { children: _jsxs("i", { children: ["Inspired by toji's awesome", ' ', _jsx("a", { href: "http://toji.github.io/texture-tester", children: "texture-tester" })] }) })] }));
}
export function renderToDOM(container) {
    createRoot(container).render(_jsx(App, {}));
}
