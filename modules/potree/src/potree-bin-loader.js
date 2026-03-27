"use strict";
// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors
Object.defineProperty(exports, "__esModule", { value: true });
exports.PotreeBinLoader = void 0;
var parse_potree_bin_1 = require("./parsers/parse-potree-bin");
/**
 * Loader for potree Binary Point Attributes
 * */
exports.PotreeBinLoader = {
    dataType: null,
    batchType: null,
    name: 'potree Binary Point Attributes',
    id: 'potree',
    extensions: ['bin'],
    mimeTypes: ['application/octet-stream'],
    // Unfortunately binary potree files have no header bytes, no test possible
    // test: ['...'],
    parseSync: parseSync,
    binary: true,
    options: {}
    // @ts-ignore
};
function parseSync(arrayBuffer, options) {
    var index = {};
    var byteOffset = 0;
    (0, parse_potree_bin_1.parsePotreeBin)(arrayBuffer, byteOffset, options, index);
    return index;
}
