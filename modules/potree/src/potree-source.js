"use strict";
// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
Object.defineProperty(exports, "__esModule", { value: true });
exports.PotreeSource = void 0;
var potree_node_source_1 = require("./lib/potree-node-source");
var VERSION = '1.7';
/**
 * Creates point cloud data sources for Potree urls
 */
exports.PotreeSource = {
    name: 'Potree',
    id: 'potree',
    module: 'potree',
    version: VERSION,
    extensions: ['bin', 'las', 'laz'],
    mimeTypes: ['application/octet-stream'],
    type: 'potree',
    fromUrl: true,
    fromBlob: true,
    defaultOptions: {
        potree: {}
    },
    testURL: function (url) { return url.endsWith('.js'); },
    createDataSource: function (url, options) {
        return new potree_node_source_1.PotreeNodesSource(url, options);
    } // , PotreeNodesSource.defaultOptions)
};
