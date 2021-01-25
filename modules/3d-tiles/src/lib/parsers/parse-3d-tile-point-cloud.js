// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {DracoLoader} from '@loaders.gl/draco';
import {GL} from '@loaders.gl/math';
import {Vector3} from '@math.gl/core';

import Tile3DFeatureTable from '../classes/tile-3d-feature-table';
import Tile3DBatchTable from '../classes/tile-3d-batch-table';
import {parse3DTileHeaderSync} from './helpers/parse-3d-tile-header';
import {parse3DTileTablesHeaderSync, parse3DTileTablesSync} from './helpers/parse-3d-tile-tables';
import {normalize3DTileColorAttribute} from './helpers/normalize-3d-tile-colors';
import {normalize3DTileNormalAttribute} from './helpers/normalize-3d-tile-normals';
import {normalize3DTilePositionAttribute} from './helpers/normalize-3d-tile-positions';

export async function parsePointCloud3DTile(tile, arrayBuffer, byteOffset, options, context) {
  byteOffset = parse3DTileHeaderSync(tile, arrayBuffer, byteOffset);
  byteOffset = parse3DTileTablesHeaderSync(tile, arrayBuffer, byteOffset);
  byteOffset = parse3DTileTablesSync(tile, arrayBuffer, byteOffset, options);
  initializeTile(tile);

  const {featureTable, batchTable} = parsePointCloudTables(tile);

  await parseDraco(tile, featureTable, batchTable, options, context);

  parsePositions(tile, featureTable, options);
  parseColors(tile, featureTable, batchTable);
  parseNormals(tile, featureTable);

  return byteOffset;
}

function initializeTile(tile) {
  // Initialize point cloud tile defaults
  tile.attributes = {
    positions: null,
    colors: null,
    normals: null,
    batchIds: null
  };
  tile.isQuantized = false;
  tile.isTranslucent = false;
  tile.isRGB565 = false;
  tile.isOctEncoded16P = false;
}

function parsePointCloudTables(tile) {
  const featureTable = new Tile3DFeatureTable(tile.featureTableJson, tile.featureTableBinary);

  const pointsLength = featureTable.getGlobalProperty('POINTS_LENGTH');
  if (!Number.isFinite(pointsLength)) {
    throw new Error('POINTS_LENGTH must be defined');
  }
  featureTable.featuresLength = pointsLength;

  tile.featuresLength = pointsLength;
  tile.pointsLength = pointsLength;
  tile.pointCount = pointsLength;

  tile.rtcCenter = featureTable.getGlobalProperty('RTC_CENTER', GL.FLOAT, 3);

  const batchTable = parseBatchIds(tile, featureTable);

  return {featureTable, batchTable};
}

function parsePositions(tile, featureTable, options) {
  if (!tile.attributes.positions) {
    if (featureTable.hasProperty('POSITION')) {
      tile.attributes.positions = featureTable.getPropertyArray('POSITION', GL.FLOAT, 3);
    } else if (featureTable.hasProperty('POSITION_QUANTIZED')) {
      const positions = featureTable.getPropertyArray('POSITION_QUANTIZED', GL.UNSIGNED_SHORT, 3);

      tile.isQuantized = true;
      tile.quantizedRange = (1 << 16) - 1;

      tile.quantizedVolumeScale = featureTable.getGlobalProperty(
        'QUANTIZED_VOLUME_SCALE',
        GL.FLOAT,
        3
      );
      if (!tile.quantizedVolumeScale) {
        throw new Error('QUANTIZED_VOLUME_SCALE must be defined for quantized positions.');
      }

      tile.quantizedVolumeOffset = featureTable.getGlobalProperty(
        'QUANTIZED_VOLUME_OFFSET',
        GL.FLOAT,
        3
      );
      if (!tile.quantizedVolumeOffset) {
        throw new Error('QUANTIZED_VOLUME_OFFSET must be defined for quantized positions.');
      }

      tile.attributes.positions = normalize3DTilePositionAttribute(tile, positions, options);
    }
  }

  if (!tile.attributes.positions) {
    throw new Error('Either POSITION or POSITION_QUANTIZED must be defined.');
  }
}

function parseColors(tile, featureTable, batchTable) {
  if (!tile.attributes.colors) {
    let colors = null;
    if (featureTable.hasProperty('RGBA')) {
      colors = featureTable.getPropertyArray('RGBA', GL.UNSIGNED_BYTE, 4);
      tile.isTranslucent = true;
    } else if (featureTable.hasProperty('RGB')) {
      colors = featureTable.getPropertyArray('RGB', GL.UNSIGNED_BYTE, 3);
    } else if (featureTable.hasProperty('RGB565')) {
      colors = featureTable.getPropertyArray('RGB565', GL.UNSIGNED_SHORT, 1);
      tile.isRGB565 = true;
    }

    tile.attributes.colors = normalize3DTileColorAttribute(tile, colors, batchTable);
  }

  if (featureTable.hasProperty('CONSTANT_RGBA')) {
    tile.constantRGBA = featureTable.getGlobalProperty('CONSTANT_RGBA', GL.UNSIGNED_BYTE, 4);
  }
}

function parseNormals(tile, featureTable) {
  if (!tile.attributes.normals) {
    let normals = null;
    if (featureTable.hasProperty('NORMAL')) {
      normals = featureTable.getPropertyArray('NORMAL', GL.FLOAT, 3);
    } else if (featureTable.hasProperty('NORMAL_OCT16P')) {
      normals = featureTable.getPropertyArray('NORMAL_OCT16P', GL.UNSIGNED_BYTE, 2);
      tile.isOctEncoded16P = true;
    }

    tile.attributes.normals = normalize3DTileNormalAttribute(tile, normals);
  }
}

function parseBatchIds(tile, featureTable) {
  let batchTable = null;
  if (!tile.batchIds && featureTable.hasProperty('BATCH_ID')) {
    tile.batchIds = featureTable.getPropertyArray('BATCH_ID', GL.UNSIGNED_SHORT, 1);

    if (tile.batchIds) {
      const batchFeatureLength = featureTable.getGlobalProperty('BATCH_LENGTH');
      if (!batchFeatureLength) {
        throw new Error('Global property: BATCH_LENGTH must be defined when BATCH_ID is defined.');
      }
      const {batchTableJson, batchTableBinary} = tile;
      batchTable = new Tile3DBatchTable(batchTableJson, batchTableBinary, batchFeatureLength);
    }
  }
  return batchTable;
}

// eslint-disable-next-line complexity
async function parseDraco(tile, featureTable, batchTable, options, context) {
  let dracoBuffer;
  let dracoFeatureTableProperties;
  let dracoBatchTableProperties;
  const batchTableDraco =
    tile.batchTableJson &&
    tile.batchTableJson.extensions &&
    tile.batchTableJson.extensions['3DTILES_draco_point_compression'];
  if (batchTableDraco) {
    dracoBatchTableProperties = batchTableDraco.properties;
  }

  const featureTableDraco = featureTable.getExtension('3DTILES_draco_point_compression');
  if (featureTableDraco) {
    dracoFeatureTableProperties = featureTableDraco.properties;
    const dracoByteOffset = featureTableDraco.byteOffset;
    const dracoByteLength = featureTableDraco.byteLength;
    if (!dracoFeatureTableProperties || !Number.isFinite(dracoByteOffset) || !dracoByteLength) {
      throw new Error('Draco properties, byteOffset, and byteLength must be defined');
    }

    dracoBuffer = tile.featureTableBinary.slice(dracoByteOffset, dracoByteOffset + dracoByteLength);

    tile.hasPositions = Number.isFinite(dracoFeatureTableProperties.POSITION);
    tile.hasColors =
      Number.isFinite(dracoFeatureTableProperties.RGB) ||
      Number.isFinite(dracoFeatureTableProperties.RGBA);
    tile.hasNormals = Number.isFinite(dracoFeatureTableProperties.NORMAL);
    tile.hasBatchIds = Number.isFinite(dracoFeatureTableProperties.BATCH_ID);
    tile.isTranslucent = Number.isFinite(dracoFeatureTableProperties.RGBA);
  }

  if (!dracoBuffer) {
    return true;
  }

  const dracoData = {
    buffer: dracoBuffer,
    properties: {...dracoFeatureTableProperties, ...dracoBatchTableProperties},
    featureTableProperties: dracoFeatureTableProperties,
    batchTableProperties: dracoBatchTableProperties,
    dequantizeInShader: false
  };

  return await loadDraco(tile, dracoData, options, context);
}

// eslint-disable-next-line complexity, max-statements
export async function loadDraco(tile, dracoData, options, context) {
  const {parse} = context;
  const dracoOptions = {
    ...options,
    draco: {
      ...options.draco,
      extraAttributes: dracoData.batchTableProperties || {}
    }
  };

  // The entire tileset might be included, too expensive to serialize
  delete dracoOptions['3d-tiles'];

  const data = await parse(dracoData.buffer, DracoLoader, dracoOptions);

  const decodedPositions = data.attributes.POSITION && data.attributes.POSITION.value;
  const decodedColors = data.attributes.COLOR_0 && data.attributes.COLOR_0.value;
  const decodedNormals = data.attributes.NORMAL && data.attributes.NORMAL.value;
  const decodedBatchIds = data.attributes.BATCH_ID && data.attributes.BATCH_ID.value;
  const isQuantizedDraco = decodedPositions && data.attributes.POSITION.value.quantization;
  const isOctEncodedDraco = decodedNormals && data.attributes.NORMAL.value.quantization;
  if (isQuantizedDraco) {
    // Draco quantization range == quantized volume scale - size in meters of the quantized volume
    // Internal quantized range is the range of values of the quantized data, e.g. 255 for 8-bit, 1023 for 10-bit, etc
    const quantization = data.POSITION.data.quantization;
    const range = quantization.range;
    tile.quantizedVolumeScale = new Vector3(range, range, range);
    tile.quantizedVolumeOffset = new Vector3(quantization.minValues);
    tile.quantizedRange = (1 << quantization.quantizationBits) - 1.0;
    tile.isQuantizedDraco = true;
  }
  if (isOctEncodedDraco) {
    tile.octEncodedRange = (1 << data.NORMAL.data.quantization.quantizationBits) - 1.0;
    tile.isOctEncodedDraco = true;
  }

  // Extra batch table attributes
  const batchTableAttributes = {};
  if (dracoData.batchTableProperties) {
    for (const attributeName of Object.keys(dracoData.batchTableProperties)) {
      if (data.attributes[attributeName] && data.attributes[attributeName].value) {
        batchTableAttributes[attributeName.toLowerCase()] = data.attributes[attributeName].value;
      }
    }
  }

  tile.attributes = {
    positions: decodedPositions,
    colors: normalize3DTileColorAttribute(tile, decodedColors),
    normals: decodedNormals,
    batchIds: decodedBatchIds,
    ...batchTableAttributes
  };
}

// TODO - this is the remaining code from Cesium's parser
/*
  const batchTable = new Tile3DBatchTable(tile);

  // parseDracoBuffer(tile, featureTable, batchTable);

  if (!tile.attributes.positions) {
    throw new Error('Either POSITION or POSITION_QUANTIZED must be defined.');
  }
}
/*

  if (!tile.attributes.positions) {
    if (featureTable.hasProperty('POSITION')) {
      tile.attributes.positions = featureTable.getPropertyArray('POSITION', GL.FLOAT, 3);
    } else if (featureTable.hasProperty('POSITION_QUANTIZED')) {
      tile.attributes.positions = featureTable.getPropertyArray('POSITION_QUANTIZED', GL.UNSIGNED_SHORT, 3);


  if (!tile.colors) {
    if (featureTable.hasProperty('RGBA')) {
      tile.colors = featureTable.getPropertyArray('RGBA', GL.UNSIGNED_BYTE, 4);
      tile.isTranslucent = true;
    } else if (featureTable.hasProperty('RGB')) {
      tile.colors = featureTable.getPropertyArray('RGB', GL.UNSIGNED_BYTE, 3);
    } else if (featureTable.hasPropertry('RGB565')) {
      tile.colors = featureTable.getPropertyArray('RGB565', GL.UNSIGNED_SHORT, 1);
      tile.isRGB565 = true;
    }
  }

  if (!tile.attributes.normals) {
    if (featureTable.getPropertry('NORMAL')) {
      tile.attributes.normals = featureTable.getPropertyArray('NORMAL', GL.FLOAT, 3);
    } else if (featureTable.getProperty('NORMAL_OCT16P')) {
      tile.attributes.normals = featureTable.getPropertyArray('NORMAL_OCT16P', GL.UNSIGNED_BYTE, 2);
      tile.isOctEncoded16P = true;
    }
  }

  if (!tile.batchIds) {
    if (featureTable.hasProperty('BATCH_ID')) {
      tile.batchIds = featureTable.getPropertyArray('BATCH_ID', GL.UNSIGNED_SHORT, 1);
    }
  }

  if (!tile.attributes.positions) {
    throw new Error('Either POSITION or POSITION_QUANTIZED must be defined.');
  }

  if (featureTable.getPropertry('CONSTANT_RGBA')) {
    tile.constantRGBA = featureTable.getGlobalProperty('CONSTANT_RGBA', GL.UNSIGNED_BYTE, 4);
  }

  if (tile.batchIds) {
    const batchLength = featureTable.getGlobalProperty('BATCH_LENGTH');
    if (!defined(batchLength)) {
      throw new Error('Global property: BATCH_LENGTH must be defined when BATCH_ID is defined.');
    }

    if (defined(batchTableBinary)) {
      // Copy the batchTableBinary section and let the underlying ArrayBuffer be freed
      batchTableBinary = new Uint8Array(batchTableBinary);
    }

    if (defined(pointCloud._batchTableLoaded)) {
      pointCloud._batchTableLoaded(batchLength, batchTableJson, batchTableBinary);
    }
  }

  // If points are not batched and there are per-point properties, use these properties for styling purposes
  var styleableProperties;
  if (!hasBatchIds && defined(batchTableBinary)) {
    tile.styleableProperties = Cesium3DTileBatchTable.getBinaryProperties(
      pointsLength,
      batchTableJson,
      batchTableBinary
    );
  }

  tile.draco = draco;
}

// Separate parsing and decoding of Draco
export function parseDracoBuffer(tile, featureTable, batchTable) {
  let dracoBuffer;
  let dracoFeatureTableProperties;
  let dracoBatchTableProperties;

  const batchTableDraco = batchTable.getExtension('3DTILES_draco_point_compression');
  if (batchTableDraco) {
    dracoBatchTableProperties = batchTableDraco.properties;
  }

  const featureTableDraco = featureTable.getExtension('3DTILES_draco_point_compression');
  if (featureTableDraco) {
    dracoFeatureTableProperties = featureTableDraco.properties;
    const dracoByteOffset = featureTableDraco.byteOffset;
    const dracoByteLength = featureTableDraco.byteLength;
    if (!dracoFeatureTableProperties || !dracoByteOffset || !dracoByteLength) {
      throw new Error('Draco properties, byteOffset, and byteLength must be defined');
    }

    dracoBuffer = arraySlice(
      featureTableBinary,
      dracoByteOffset,
      dracoByteOffset + dracoByteLength
    );
    tile.hasPositions = dracoFeatureTableProperties.POSITION;
    tile.hasColors = dracoFeatureTableProperties.RGB || dracoFeatureTableProperties.RGBA;
    tile.hasNormals = dracoFeatureTableProperties.NORMAL;
    tile.hasBatchIds = dracoFeatureTableProperties.BATCH_ID;
    tile.isTranslucent = dracoFeatureTableProperties.RGBA;
  }

  if (dracoBuffer) {
    tile.draco = {
      buffer: dracoBuffer,
      properties: {...dracoFeatureTableProperties, ...dracoBatchTableProperties},
      featureTableProperties: dracoFeatureTableProperties,
      batchTableProperties: dracoBatchTableProperties,
      dequantizeInShader: false
    };

    tile.decodingState = DECODING_STATE.NEEDS_DECODE;
  }
}

/*
function decodeDraco(tile, context) {
  if (tile.decodingState === DECODING_STATE.READY) {
    return false;
  }
  if (tile.decodingState === DECODING_STATE.NEEDS_DECODE) {
    var parsedContent = tile._parsedContent;
    var draco = parsedContent.draco;
    var decodePromise = DracoLoader.decodePointCloud(draco, context);
    if (defined(decodePromise)) {
      tile.decodingState = DECODING_STATE.DECODING;
      decodePromise.then(function(result) {
        tile.decodingState = DECODING_STATE.READY;
        var decodedPositions = defined(result.POSITION) ? result.POSITION.array : undefined;
        var decodedRgb = defined(result.RGB) ? result.RGB.array : undefined;
        var decodedRgba = defined(result.RGBA) ? result.RGBA.array : undefined;
        var decodedNormals = defined(result.NORMAL) ? result.NORMAL.array : undefined;
        var decodedBatchIds = defined(result.BATCH_ID) ? result.BATCH_ID.array : undefined;
        var isQuantizedDraco = defined(decodedPositions) && defined(result.POSITION.data.quantization);
        var isOctEncodedDraco = defined(decodedNormals) && defined(result.NORMAL.data.quantization);
        if (isQuantizedDraco) {
          // Draco quantization range == quantized volume scale - size in meters of the quantized volume
          // Internal quantized range is the range of values of the quantized data, e.g. 255 for 8-bit, 1023 for 10-bit, etc
          var quantization = result.POSITION.data.quantization;
          var range = quantization.range;
          tile._quantizedVolumeScale = Cartesian3.fromElements(range, range, range);
          tile._quantizedVolumeOffset = Cartesian3.unpack(quantization.minValues);
          tile._quantizedRange = (1 << quantization.quantizationBits) - 1.0;
          tile._isQuantizedDraco = true;
        }
        if (isOctEncodedDraco) {
          tile._octEncodedRange = (1 << result.NORMAL.data.quantization.quantizationBits) - 1.0;
          tile._isOctEncodedDraco = true;
        }
        var styleableProperties = parsedContent.styleableProperties;
        var batchTableProperties = draco.batchTableProperties;
        for (var name in batchTableProperties) {
          if (batchTableProperties.hasOwnProperty(name)) {
            var property = result[name];
            if (!defined(styleableProperties)) {
              styleableProperties = {};
            }
            styleableProperties[name] = {
              typedArray : property.array,
              componentCount : property.data.componentsPerAttribute
            };
          }
        }
        parsedContent.positions = defaultValue(decodedPositions, parsedContent.positions);
        parsedContent.colors = defaultValue(defaultValue(decodedRgba, decodedRgb), parsedContent.colors);
        parsedContent.normals = defaultValue(decodedNormals, parsedContent.normals);
        parsedContent.batchIds = defaultValue(decodedBatchIds, parsedContent.batchIds);
        parsedContent.styleableProperties = styleableProperties;
      }).otherwise(function(error) {
        tile.decodingState = DECODING_STATE.FAILED;
        tile._readyPromise.reject(error);
      });
    }
  }
  return true;
}
*/
