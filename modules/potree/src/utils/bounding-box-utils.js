"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCartographicOriginFromBoundingBox = void 0;
/**
 * Calculate cartographic origin from Potree bounding box
 * @param projection - Proj4Projection instance to reproject coordinates
 * @param boundingBox - bounding box data
 * @returns - origin of boudngin box in [lng, lat, z] mode
 */
var getCartographicOriginFromBoundingBox = function (projection, boundingBox) {
    var _a, _b;
    if (!boundingBox) {
        return [0, 0, 0];
    }
    var _c = boundingBox[0], minXOriginal = _c[0], minYOriginal = _c[1], minZ = _c[2];
    var _d = boundingBox[1], maxXOriginal = _d[0], maxYOriginal = _d[1], maxZ = _d[2];
    var minX = minXOriginal;
    var minY = minYOriginal;
    var maxX = maxXOriginal;
    var maxY = maxYOriginal;
    if (projection) {
        _a = projection.project([minX, minY]), minX = _a[0], minY = _a[1];
        _b = projection.project([maxX, maxY]), maxX = _b[0], maxY = _b[1];
    }
    return [minX + (maxX - minX) / 2, minY + (maxY - minY) / 2, minZ + (maxZ - minZ) / 2];
};
exports.getCartographicOriginFromBoundingBox = getCartographicOriginFromBoundingBox;
