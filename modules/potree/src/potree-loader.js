"use strict";
// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors
Object.defineProperty(exports, "__esModule", { value: true });
exports.PotreeLoader = void 0;
// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
var VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';
/** Potree loader */
exports.PotreeLoader = {
    dataType: null,
    batchType: null,
    name: 'potree metadata',
    id: 'potree',
    module: 'potree',
    version: VERSION,
    extensions: ['js'],
    mimeTypes: ['application/json'],
    testText: function (text) { return text.indexOf('octreeDir') >= 0; },
    parse: function (data) { return JSON.parse(new TextDecoder().decode(data)); },
    parseTextSync: function (text) { return JSON.parse(text); },
    options: {
        potree: {}
    }
};
