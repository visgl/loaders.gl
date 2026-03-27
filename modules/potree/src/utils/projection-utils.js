"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProjection = void 0;
var proj4_1 = require("@math.gl/proj4");
/**
 * Create projection from proj4 definition to WGS84
 * @param projectionData - proj4 definition
 * @returns projection instance
 */
var createProjection = function (projectionData) {
    if (!projectionData) {
        return null;
    }
    return new proj4_1.Proj4Projection({
        from: projectionData,
        to: 'WGS84'
    });
};
exports.createProjection = createProjection;
