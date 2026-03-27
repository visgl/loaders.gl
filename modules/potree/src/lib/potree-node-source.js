"use strict";
// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PotreeNodesSource = exports.COORDINATE_SYSTEM = void 0;
var core_1 = require("@loaders.gl/core");
var loader_utils_1 = require("@loaders.gl/loader-utils");
var las_1 = require("@loaders.gl/las");
var potree_hierarchy_chunk_loader_1 = require("../potree-hierarchy-chunk-loader");
var potree_loader_1 = require("../potree-loader");
var parse_version_1 = require("../utils/parse-version");
var proj4_1 = require("@math.gl/proj4");
var projection_utils_1 = require("../utils/projection-utils");
var bounding_box_utils_1 = require("../utils/bounding-box-utils");
// https://github.com/visgl/deck.gl/blob/9548f43cba2234a1f4877b6b17f6c88eb35b2e08/modules/core/src/lib/constants.js#L27
// Describes the format of positions
var COORDINATE_SYSTEM;
(function (COORDINATE_SYSTEM) {
    /**
     * `LNGLAT` if rendering into a geospatial viewport, `CARTESIAN` otherwise
     */
    COORDINATE_SYSTEM[COORDINATE_SYSTEM["DEFAULT"] = -1] = "DEFAULT";
    /**
     * Positions are interpreted as [lng, lat, elevation]
     * lng lat are degrees, elevation is meters. distances as meters.
     */
    COORDINATE_SYSTEM[COORDINATE_SYSTEM["LNGLAT"] = 1] = "LNGLAT";
    /**
     * Positions are interpreted as meter offsets, distances as meters
     */
    COORDINATE_SYSTEM[COORDINATE_SYSTEM["METER_OFFSETS"] = 2] = "METER_OFFSETS";
    /**
     * Positions are interpreted as lng lat offsets: [deltaLng, deltaLat, elevation]
     * deltaLng, deltaLat are delta degrees, elevation is meters.
     * distances as meters.
     */
    COORDINATE_SYSTEM[COORDINATE_SYSTEM["LNGLAT_OFFSETS"] = 3] = "LNGLAT_OFFSETS";
    /**
     * Non-geospatial
     */
    COORDINATE_SYSTEM[COORDINATE_SYSTEM["CARTESIAN"] = 0] = "CARTESIAN";
})(COORDINATE_SYSTEM || (exports.COORDINATE_SYSTEM = COORDINATE_SYSTEM = {}));
/**
 * A Potree data source
 * @version 1.0 - @see https://github.com/potree/potree/blob/1.0RC/docs/file_format.md
 * @version 1.7 - @see https://github.com/potree/potree/blob/1.7/docs/potree-file-format.md
 * @note Point cloud nodes tile source
 */
var PotreeNodesSource = /** @class */ (function (_super) {
    __extends(PotreeNodesSource, _super);
    /**
     * @constructor
     * @param data  - if string - data set path url or path to `cloud.js` metadata file
     *              - if Blob - single file data
     * @param options - data source properties
     */
    function PotreeNodesSource(data, options) {
        var _this = _super.call(this, data, options) || this;
        /** Dataset base URL */
        _this.baseUrl = '';
        /** Meta information from `cloud.js` */
        _this.metadata = null;
        /** Root node */
        _this.root = null;
        /** Is data source ready to use after initial loading */
        _this.isReady = false;
        /** local CRS to WGS84 projection */
        _this.projection = null;
        /** Tile lookup by normalized tile id */
        _this.nodeById = new Map();
        _this.initPromise = null;
        _this.makeBaseUrl(data);
        _this.initPromise = _this.initialize();
        return _this;
    }
    /** Initial data source loading */
    PotreeNodesSource.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.initPromise) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.initPromise];
                    case 1:
                        _c.sent();
                        return [2 /*return*/];
                    case 2:
                        _a = this;
                        return [4 /*yield*/, (0, core_1.load)("".concat(this.baseUrl, "/cloud.js"), potree_loader_1.PotreeLoader)];
                    case 3:
                        _a.metadata = _c.sent();
                        this.projection = (0, projection_utils_1.createProjection)((_b = this.metadata) === null || _b === void 0 ? void 0 : _b.projection);
                        this.parseBoundingVolume();
                        return [4 /*yield*/, this.loadHierarchy()];
                    case 4:
                        _c.sent();
                        this.isReady = true;
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Backwards-compatible alias for existing callers.
     */
    PotreeNodesSource.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.initialize()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Is data set supported */
    PotreeNodesSource.prototype.isSupported = function () {
        var _a, _b, _c, _d;
        var _e = (0, parse_version_1.parseVersion)((_b = (_a = this.metadata) === null || _a === void 0 ? void 0 : _a.version) !== null && _b !== void 0 ? _b : ''), minor = _e.minor, major = _e.major;
        return (this.isReady &&
            major === 1 &&
            minor <= 8 &&
            typeof ((_c = this.metadata) === null || _c === void 0 ? void 0 : _c.pointAttributes) === 'string' &&
            ['LAS', 'LAZ'].includes((_d = this.metadata) === null || _d === void 0 ? void 0 : _d.pointAttributes));
    };
    /** Get content files extension */
    PotreeNodesSource.prototype.getContentExtension = function () {
        var _a;
        if (!this.isReady) {
            return null;
        }
        switch ((_a = this.metadata) === null || _a === void 0 ? void 0 : _a.pointAttributes) {
            case 'LAS':
                return 'las';
            case 'LAZ':
                return 'laz';
            default:
                return 'bin';
        }
    };
    /**
     * Load octree node content
     * @param nodeName name of a node, string of numbers in range 0..7
     * @return node content geometry or null if the node doesn't exist
     */
    PotreeNodesSource.prototype.loadNodeContent = function (nodeName) {
        return __awaiter(this, void 0, void 0, function () {
            var isAvailable, result, position, i, vertex, offsets;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, this.initPromise];
                    case 1:
                        _e.sent();
                        if (!this.isSupported()) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, this.isNodeAvailable(nodeName)];
                    case 2:
                        isAvailable = _e.sent();
                        if (!isAvailable) return [3 /*break*/, 4];
                        return [4 /*yield*/, (0, core_1.load)("".concat(this.baseUrl, "/").concat((_a = this.metadata) === null || _a === void 0 ? void 0 : _a.octreeDir, "/r/r").concat(nodeName, ".").concat(this.getContentExtension()), las_1.LASLoader)];
                    case 3:
                        result = (_e.sent());
                        if (result) {
                            result.cartographicOrigin = (0, bounding_box_utils_1.getCartographicOriginFromBoundingBox)(this.projection, (_b = result.header) === null || _b === void 0 ? void 0 : _b.boundingBox);
                            position = result.attributes.POSITION.value;
                            for (i = 0; i < ((_d = (_c = result.header) === null || _c === void 0 ? void 0 : _c.vertexCount) !== null && _d !== void 0 ? _d : 0); i++) {
                                vertex = position.slice(i * 3, i * 3 + 2);
                                if (this.projection) {
                                    vertex = this.projection.project(Array.from(vertex));
                                }
                                offsets = [
                                    vertex[0] - result.cartographicOrigin[0],
                                    vertex[1] - result.cartographicOrigin[1],
                                    position[i * 3 + 2] - result.cartographicOrigin[2]
                                ];
                                position.set(offsets, i * 3);
                            }
                            result.attributes.positions = result.attributes.POSITION;
                            result.attributes.colors = result.attributes.COLOR_0;
                            result.attributes.normals = result.attributes.NORMAL;
                            result.coordinateSystem = COORDINATE_SYSTEM.LNGLAT_OFFSETS;
                            return [2 /*return*/, result];
                        }
                        _e.label = 4;
                    case 4: return [2 /*return*/, null];
                }
            });
        });
    };
    /**
     * Load normalized point cloud tile content.
     */
    PotreeNodesSource.prototype.loadTileContent = function (tile) {
        return __awaiter(this, void 0, void 0, function () {
            var nodeName;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nodeName = this.getNodeName(tile.id);
                        return [4 /*yield*/, this.loadNodeContent(nodeName)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Return the normalized root tile header.
     */
    PotreeNodesSource.prototype.getRootTile = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.initPromise];
                    case 1:
                        _a.sent();
                        if (!this.root) {
                            throw new Error('Potree root hierarchy is not initialized');
                        }
                        return [2 /*return*/, this.getTileHeader(this.root)];
                }
            });
        });
    };
    /**
     * Return normalized child tile headers.
     */
    PotreeNodesSource.prototype.getChildren = function (tile) {
        return __awaiter(this, void 0, void 0, function () {
            var node;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.initPromise];
                    case 1:
                        _a.sent();
                        node = this.nodeById.get(tile.id);
                        if (!node) {
                            return [2 /*return*/, []];
                        }
                        return [2 /*return*/, node.children.map(function (child) { return _this.getTileHeader(child); })];
                }
            });
        });
    };
    /**
     * Return normalized view metadata for the tileset.
     */
    PotreeNodesSource.prototype.getViewState = function () {
        if (!this.boundingBox) {
            return {};
        }
        var boundingVolume = this.getBoundingVolumeForNodeId('r');
        return {
            boundingVolume: boundingVolume,
            cartographicCenter: boundingVolume.center
        };
    };
    /**
     * Check if a node exists in the octree
     * @param nodeName name of a node, string of numbers in range 0..7
     * @returns true - the node does exist, false - the nodes doesn't exist
     */
    PotreeNodesSource.prototype.isNodeAvailable = function (nodeName) {
        return __awaiter(this, void 0, void 0, function () {
            var currentParent, name, result, _loop_1, _i, nodeName_1, char, state_1;
            var _a;
            return __generator(this, function (_b) {
                if ((_a = this.metadata) === null || _a === void 0 ? void 0 : _a.hierarchy) {
                    return [2 /*return*/, this.metadata.hierarchy.findIndex(function (item) { return item[0] === "r".concat(nodeName); }) !== -1];
                }
                if (!this.root) {
                    return [2 /*return*/, false];
                }
                currentParent = this.root;
                name = '';
                result = true;
                _loop_1 = function (char) {
                    var newName = "".concat(name).concat(char);
                    var node = currentParent.children.find(function (child) { return child.name === newName; });
                    if (node) {
                        currentParent = node;
                        name = newName;
                    }
                    else {
                        result = false;
                        return "break";
                    }
                };
                for (_i = 0, nodeName_1 = nodeName; _i < nodeName_1.length; _i++) {
                    char = nodeName_1[_i];
                    state_1 = _loop_1(char);
                    if (state_1 === "break")
                        break;
                }
                return [2 /*return*/, result];
            });
        });
    };
    /**
     * Load data source hierarchy into tree of available nodes
     */
    PotreeNodesSource.prototype.loadHierarchy = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, (0, core_1.load)("".concat(this.baseUrl, "/").concat((_b = this.metadata) === null || _b === void 0 ? void 0 : _b.octreeDir, "/r/r.hrc"), potree_hierarchy_chunk_loader_1.PotreeHierarchyChunkLoader)];
                    case 1:
                        _a.root = _c.sent();
                        this.indexNodes();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Deduce base url from the input url sring
     * @param data - data source input data
     */
    PotreeNodesSource.prototype.makeBaseUrl = function (data) {
        this.baseUrl = typeof data === 'string' ? (0, loader_utils_1.resolvePath)(data) : '';
        if (this.baseUrl.endsWith('cloud.js')) {
            this.baseUrl = this.baseUrl.slice(0, -8);
        }
        if (this.baseUrl.endsWith('/')) {
            this.baseUrl = this.baseUrl.substring(0, -1);
        }
    };
    PotreeNodesSource.prototype.parseBoundingVolume = function () {
        var _a, _b;
        if (((_a = this.metadata) === null || _a === void 0 ? void 0 : _a.projection) && this.metadata.tightBoundingBox) {
            var projection = new proj4_1.Proj4Projection({
                from: this.metadata.projection,
                to: 'WGS84'
            });
            var _c = this.metadata.tightBoundingBox, lx = _c.lx, ly = _c.ly, ux = _c.ux, uy = _c.uy;
            var lCoord = [lx, ly];
            var wgs84LCood = projection.project(lCoord);
            var uCoord = [ux, uy];
            var wgs84UCood = projection.project(uCoord);
            this.boundingBox = __assign(__assign({}, this.metadata.tightBoundingBox), { lx: wgs84LCood[0], ly: wgs84LCood[1], ux: wgs84UCood[0], uy: wgs84UCood[1] });
        }
        else {
            this.boundingBox = (_b = this.metadata) === null || _b === void 0 ? void 0 : _b.tightBoundingBox;
        }
    };
    PotreeNodesSource.prototype.getTileHeader = function (node) {
        var _a;
        return {
            id: this.getTileId(node),
            level: node.level,
            pointCount: node.pointCount,
            geometricError: (((_a = this.metadata) === null || _a === void 0 ? void 0 : _a.spacing) || 0) / Math.pow(2, node.level),
            boundingVolume: this.getBoundingVolumeForNodeId(this.getTileId(node))
        };
    };
    PotreeNodesSource.prototype.getTileId = function (node) {
        return node.name ? "r".concat(node.name) : 'r';
    };
    PotreeNodesSource.prototype.getNodeName = function (tileId) {
        return tileId === 'r' ? '' : tileId.slice(1);
    };
    PotreeNodesSource.prototype.indexNodes = function () {
        this.nodeById.clear();
        if (!this.root) {
            return;
        }
        var stack = [this.root];
        while (stack.length) {
            var node = stack.pop();
            if (node) {
                this.nodeById.set(this.getTileId(node), node);
                for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    stack.push(child);
                }
            }
        }
    };
    PotreeNodesSource.prototype.getBoundingVolumeForNodeId = function (tileId) {
        var bounds = this.getNodeBounds(tileId);
        var center = [
            (bounds.lx + bounds.ux) / 2,
            (bounds.ly + bounds.uy) / 2,
            (bounds.lz + bounds.uz) / 2
        ];
        var radius = Math.sqrt(Math.pow(bounds.ux - center[0], 2) +
            Math.pow(bounds.uy - center[1], 2) +
            Math.pow(bounds.uz - center[2], 2));
        return {
            cartographicBounds: [
                [bounds.lx, bounds.ly, bounds.lz],
                [bounds.ux, bounds.uy, bounds.uz]
            ],
            center: center,
            radius: radius
        };
    };
    PotreeNodesSource.prototype.getNodeBounds = function (tileId) {
        if (!this.boundingBox) {
            throw new Error('Potree bounding box is not initialized');
        }
        var nodeName = this.getNodeName(tileId);
        var bounds = __assign({}, this.boundingBox);
        for (var _i = 0, nodeName_2 = nodeName; _i < nodeName_2.length; _i++) {
            var char = nodeName_2[_i];
            var index = Number(char);
            var middleX = (bounds.lx + bounds.ux) / 2;
            var middleY = (bounds.ly + bounds.uy) / 2;
            var middleZ = (bounds.lz + bounds.uz) / 2;
            if (index & 4) {
                bounds.lx = middleX;
            }
            else {
                bounds.ux = middleX;
            }
            if (index & 2) {
                bounds.ly = middleY;
            }
            else {
                bounds.uy = middleY;
            }
            if (index & 1) {
                bounds.lz = middleZ;
            }
            else {
                bounds.uz = middleZ;
            }
        }
        return bounds;
    };
    return PotreeNodesSource;
}(loader_utils_1.DataSource));
exports.PotreeNodesSource = PotreeNodesSource;
