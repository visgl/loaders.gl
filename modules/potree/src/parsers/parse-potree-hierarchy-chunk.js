"use strict";
// This file is derived from the Cesium code base under BSD 2-clause license
// See LICENSE.md and https://github.com/potree/potree/blob/develop/LICENSE
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePotreeHierarchyChunk = parsePotreeHierarchyChunk;
/**
 * load hierarchy
 * @param arrayBuffer - binary index data
 * @returns root node
 **/
function parsePotreeHierarchyChunk(arrayBuffer) {
    var tileHeaders = parseBinaryChunk(arrayBuffer);
    return buildHierarchy(tileHeaders);
}
/**
 * Parses the binary rows
 * @param arrayBuffer - binary index data to parse
 * @param byteOffset - byte offset to start from
 * @returns flat nodes array
 * */
function parseBinaryChunk(arrayBuffer, byteOffset) {
    if (byteOffset === void 0) { byteOffset = 0; }
    var dataView = new DataView(arrayBuffer);
    var stack = [];
    // Get root mask
    // @ts-expect-error
    var topTileHeader = {};
    byteOffset = decodeRow(dataView, byteOffset, topTileHeader);
    stack.push(topTileHeader);
    var tileHeaders = [topTileHeader];
    while (stack.length > 0) {
        var snode = stack.shift();
        var mask = 1;
        for (var i = 0; i < 8; i++) {
            if (snode && (snode.header.childMask & mask) !== 0) {
                // @ts-expect-error
                var tileHeader = {};
                byteOffset = decodeRow(dataView, byteOffset, tileHeader);
                tileHeader.name = snode.name + i;
                stack.push(tileHeader);
                tileHeaders.push(tileHeader);
                snode.header.childCount++;
            }
            mask = mask * 2;
        }
        if (byteOffset === dataView.byteLength) {
            break;
        }
    }
    return tileHeaders;
}
/**
 * Reads next row from binary index file
 * @param dataView - index data
 * @param byteOffset - current offset in the index data
 * @param tileHeader - container to read to
 * @returns new offset
 */
function decodeRow(dataView, byteOffset, tileHeader) {
    tileHeader.header = tileHeader.header || {};
    tileHeader.header.childMask = dataView.getUint8(byteOffset);
    tileHeader.header.childCount = 0;
    tileHeader.pointCount = dataView.getUint32(byteOffset + 1, true);
    tileHeader.name = '';
    byteOffset += 5;
    return byteOffset;
}
/** Resolves the binary rows into a hierarchy (tree structure) */
function buildHierarchy(flatNodes, options) {
    if (options === void 0) { options = {}; }
    var DEFAULT_OPTIONS = { spacing: 100 }; // TODO assert instead of default?
    options = __assign(__assign({}, DEFAULT_OPTIONS), options);
    var topNode = flatNodes[0];
    var nodes = {};
    for (var _i = 0, flatNodes_1 = flatNodes; _i < flatNodes_1.length; _i++) {
        var node = flatNodes_1[_i];
        var name_1 = node.name;
        var index = parseInt(name_1.charAt(name_1.length - 1), 10);
        var parentName = name_1.substring(0, name_1.length - 1);
        var parentNode = nodes[parentName];
        var level = name_1.length;
        // assert(parentNode && level >= 0);
        node.level = level;
        node.hasChildren = Boolean(node.header.childCount);
        node.children = [];
        node.childrenByIndex = new Array(8).fill(null);
        node.spacing = ((options === null || options === void 0 ? void 0 : options.spacing) || 0) / Math.pow(2, level);
        node.type = 'pointcloud';
        node.id = node.name;
        // tileHeader.boundingVolume = Utils.createChildAABB(parentNode.boundingBox, index);
        if (parentNode) {
            parentNode.children.push(node);
            parentNode.childrenByIndex[index] = node;
        }
        // Add the node to the map
        nodes[name_1] = node;
    }
    // First node is the root
    return topNode;
}
