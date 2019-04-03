// TODO - encoders are a work in progress

import {assert} from '@loaders.gl/core';

// Procedurally encode the tile array buffer for testing purposes
// eslint-disable-next-line max-statements
export function encodeBatchedModel3DTile(options = {}) {
  const magic = [98, 51, 100, 109];

  const {featuresLength = 1} = options;

  const featureTableJson = {
    BATCH_LENGTH: featuresLength
  };
  const featureTableJsonString = JSON.stringify(featureTableJson);
  const featureTableJsonByteLength = featureTableJsonString.length;

  const headerByteLength = 28;
  const byteLength = headerByteLength + featureTableJsonByteLength;

  const buffer = new ArrayBuffer(byteLength);

  encodeTile3DHeader(buffer, 0, {magic, byteLength, ...options});

  const view = new DataView(buffer);

  view.setUint32(12, featureTableJsonByteLength, true); // featureTableJsonByteLength
  view.setUint32(16, 0, true); // featureTableBinaryByteLength
  view.setUint32(20, 0, true); // batchTableJsonByteLength
  view.setUint32(24, 0, true); // batchTableBinaryByteLength

  let byteOffset = headerByteLength;
  for (let i = 0; i < featureTableJsonByteLength; i++) {
    view.setUint8(byteOffset, featureTableJsonString.charCodeAt(i));
    byteOffset++;
  }

  return buffer;
}

// Procedurally encode the tile array buffer for testing purposes
// eslint-disable-next-line max-statements
export function encodeInstancedModel3DTile(options) {
  const magic = [105, 51, 100, 109];

  const {featuresLength = 1, gltfFormat = 1, gltfUri = ''} = options;

  const gltfUriByteLength = gltfUri.length;

  const featureTableJson = {
    INSTANCES_LENGTH: featuresLength,
    POSITION: arrayFill(new Array(featuresLength * 3), 0)
  };
  const featureTableJsonString = JSON.stringify(featureTableJson);
  const featureTableJsonByteLength = featureTableJsonString.length;

  const headerByteLength = 32;
  const uriByteLength = gltfUri.length;
  const byteLength = headerByteLength + featureTableJsonByteLength + uriByteLength;
  const buffer = new ArrayBuffer(byteLength);
  const view = new DataView(buffer);

  encodeTile3DHeader(buffer, 0, {magic, byteLength, ...options});

  view.setUint32(12, featureTableJsonByteLength, true); // featureTableJsonByteLength
  view.setUint32(16, 0, true); // featureTableBinaryByteLength
  view.setUint32(20, 0, true); // batchTableJsonByteLength
  view.setUint32(24, 0, true); // batchTableBinaryByteLength
  view.setUint32(28, gltfFormat, true); // gltfFormat

  let byteOffset = headerByteLength;
  for (let i = 0; i < featureTableJsonByteLength; i++) {
    view.setUint8(byteOffset, featureTableJsonString.charCodeAt(i));
    byteOffset++;
  }
  for (let i = 0; i < gltfUriByteLength; i++) {
    view.setUint8(byteOffset, gltfUri.charCodeAt(i));
    byteOffset++;
  }
  return buffer;
}

// Procedurally encode the tile array buffer for testing purposes
// eslint-disable-next-line max-statements
export function encodePointCloud3DTile(options = {}) {
  const DEFAULT_FEATURE_TABLE_JSON = {
    POINTS_LENGTH: 1,
    POSITIONS: {
      byteOffset: 0
    }
  };
  const magic = [112, 110, 116, 115];

  const {featureTableJson = DEFAULT_FEATURE_TABLE_JSON} = options;

  let featureTableJsonString = JSON.stringify(featureTableJson);
  featureTableJsonString = padStringToByteAlignment(featureTableJsonString, 4);
  const {featureTableJsonByteLength = featureTableJsonString.length} = options;

  const featureTableBinary = new ArrayBuffer(12); // Enough space to hold 3 floats
  const featureTableBinaryByteLength = featureTableBinary.byteLength;

  const headerByteLength = 28;
  const byteLength = headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength;
  const buffer = new ArrayBuffer(byteLength);

  encodeTile3DHeader(buffer, 0, {magic: MAGIC, ...options, byteLength});

  const view = new DataView(buffer);
  view.setUint32(12, featureTableJsonByteLength, true); // featureTableJsonByteLength
  view.setUint32(16, featureTableBinaryByteLength, true); // featureTableBinaryByteLength
  view.setUint32(20, 0, true); // batchTableJsonByteLength
  view.setUint32(24, 0, true); // batchTableBinaryByteLength

  let byteOffset = headerByteLength;
  for (let i = 0; i < featureTableJsonByteLength; i++) {
    view.setUint8(byteOffset, featureTableJsonString.charCodeAt(i));
    byteOffset++;
  }
  for (let i = 0; i < featureTableBinaryByteLength; i++) {
    view.setUint8(byteOffset, featureTableBinary[i]);
    byteOffset++;
  }
  return buffer;
}

// eslint-disable-next-line max-statements
// Procedurally encode the tile array buffer for testing purposes
export function encodeComposite3DTile(options = []) {
  const MAGIC = [99, 109, 112, 116];

  const {tiles = []} = options;
  const tilesLength = tiles.length;

  let tilesByteLength = 0;
  for (let i = 0; i < tilesLength; ++i) {
    tilesByteLength += tiles[i].byteLength;
  }

  const headerByteLength = 16;
  const byteLength = headerByteLength + tilesByteLength;
  const buffer = new ArrayBuffer(byteLength);

  encodeTile3DHeader(buffer, 0, {magic: MAGIC, ...options, byteLength});

  const view = new DataView(buffer);
  view.setUint32(12, tilesLength, true); // tilesLength

  const uint8Array = new Uint8Array(buffer);
  let byteOffset = headerByteLength;
  for (let i = 0; i < tilesLength; ++i) {
    const tile = new Uint8Array(tiles[i]);
    uint8Array.set(tile, byteOffset);
    byteOffset += tile.byteLength;
  }

  return buffer;
}

// eslint-disable-next-line max-statements
export function encodeVector3DTile(options = {}) {
  // Procedurally encode the tile array buffer for testing purposes
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  var magic = defaultValue(options.magic, [118, 99, 116, 114]);
  var version = defaultValue(options.version, 1);

  var featureTableJsonString;
  var featureTableJsonByteLength = 0;
  var defineFeatureTable = defaultValue(options.defineFeatureTable, true);
  if (defineFeatureTable) {
    var defineRegion = defaultValue(options.defineRegion, true);
    var featureTableJson = {
      REGION: defineRegion ? [-1.0, -1.0, 1.0, 1.0, -1.0, 1.0] : undefined,
      POLYGONS_LENGTH: defaultValue(options.polygonsLength, 0),
      POLYLINES_LENGTH: defaultValue(options.polylinesLength, 0),
      POINTS_LENGTH: defaultValue(options.pointsLength, 0),
      POLYGON_BATCH_IDS: options.polygonBatchIds,
      POLYLINE_BATCH_IDS: options.polylineBatchIds,
      POINT_BATCH_IDS: options.pointBatchIds
    };
    featureTableJsonString = JSON.stringify(featureTableJson);
    featureTableJsonByteLength = featureTableJsonString.length;
  }

  const headerByteLength = 44;
  const byteLength = headerByteLength + featureTableJsonByteLength;

  const buffer = new ArrayBuffer(byteLength);

  encodeTile3DHeader(buffer, 0, {...options, byteLength});

  const view = new DataView(buffer);
  view.setUint32(12, featureTableJsonByteLength, true); // featureTableJsonByteLength
  view.setUint32(16, 0, true); // featureTableBinaryByteLength
  view.setUint32(20, 0, true); // batchTableJsonByteLength
  view.setUint32(24, 0, true); // batchTableBinaryByteLength

  view.setUint32(28, 0, true); // indicesByteLength
  view.setUint32(32, 0, true); // polygonPositionByteLength
  view.setUint32(36, 0, true); // polylinePositionByteLength
  view.setUint32(40, 0, true); // pointsPositionByteLength

  let byteOffset = headerByteLength;
  for (let i = 0; i < featureTableJsonByteLength; i++) {
    view.setUint8(byteOffset, featureTableJsonString.charCodeAt(i));
    byteOffset++;
  }

  return buffer;
}

// eslint-disable-next-line max-statements
// Procedurally encode the tile array buffer for testing purposes
export function encodeGeometry3DTile(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  var magic = defaultValue(options.magic, [103, 101, 111, 109]);
  var version = defaultValue(options.version, 1);

  var featureTableJsonString;
  var featureTableJsonByteLength = 0;
  var defineFeatureTable = defaultValue(options.defineFeatureTable, true);
  if (defineFeatureTable) {
    var featureTableJson = {
      BOXES_LENGTH: defaultValue(options.boxesLength, 0),
      CYLINDERS_LENGTH: defaultValue(options.cylindersLength, 0),
      ELLIPSOIDS_LENGTH: defaultValue(options.ellipsoidsLength, 0),
      SPHERES_LENGTH: defaultValue(options.spheresLength, 0),
      BOX_BATCH_IDS: options.boxBatchIds,
      CYLINDER_BATCH_IDS: options.cylinderBatchIds,
      ELLIPSOID_BATCH_IDS: options.ellipsoidBatchIds,
      SPHERE_BATCH_IDS: options.sphereBatchIds
    };
    featureTableJsonString = JSON.stringify(featureTableJson);
    featureTableJsonByteLength = featureTableJsonString.length;
  }

  var headerByteLength = 28;
  var byteLength = headerByteLength + featureTableJsonByteLength;
  var buffer = new ArrayBuffer(byteLength);

  encodeTile3DHeader(buffer, byteOffset, options);

  const view = new DataView(buffer);
  view.setUint8(0, magic[0]);
  view.setUint8(1, magic[1]);
  view.setUint8(2, magic[2]);
  view.setUint8(3, magic[3]);
  view.setUint32(4, version, true); // version
  view.setUint32(8, byteLength, true); // byteLength
  view.setUint32(12, featureTableJsonByteLength, true); // featureTableJsonByteLength
  view.setUint32(16, 0, true); // featureTableBinaryByteLength
  view.setUint32(20, 0, true); // batchTableJsonByteLength
  view.setUint32(24, 0, true); // batchTableBinaryByteLength

  let byteOffset = headerByteLength;
  for (let i = 0; i < featureTableJsonByteLength; i++) {
    view.setUint8(byteOffset, featureTableJsonString.charCodeAt(i));
    byteOffset++;
  }

  return buffer;
}

// HELPER ENCODERS

function encodeTile3DHeader(buffer, byteOffset, options) {
  const HEADER_SIZE = 12;

  if (!buffer) {
    return {byteOffset: byteOffset + HEADER_SIZE};
  }

  const {magic, version = 1, byteLength} = options;

  assert(Array.isArray(magic) && Number.isFinite(version) && Number.isFinite(byteLength));

  const view = new DataView(buffer);
  view.setUint8(byteOffset + 0, magic[0]);
  view.setUint8(byteOffset + 1, magic[1]);
  view.setUint8(byteOffset + 2, magic[2]);
  view.setUint8(byteOffset + 3, magic[3]);
  view.setUint32(byteOffset + 4, version, true); // version
  view.setUint32(byteOffset + 8, byteLength, true); // byteLength

  byteOffset += HEADER_SIZE;

  return {buffer, byteOffset};
}

// UTILITIES

function padStringToByteAlignment(string, byteAlignment) {
  const length = string.length;
  const paddedLength = Math.ceil(length / byteAlignment) * byteAlignment; // Round up to the required alignment
  const padding = paddedLength - length;
  let whitespace = '';
  for (let i = 0; i < padding; ++i) {
    whitespace += ' ';
  }
  return string + whitespace;
}
