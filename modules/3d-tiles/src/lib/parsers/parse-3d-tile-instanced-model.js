// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {Vector3, Matrix3, Matrix4, Quaternion} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {GL} from '@loaders.gl/math'; // 'math.gl/geometry';
import Tile3DFeatureTable from '../classes/tile-3d-feature-table';
import Tile3DBatchTable from '../classes/tile-3d-batch-table';

import {parse3DTileHeaderSync} from './helpers/parse-3d-tile-header';
import {parse3DTileTablesHeaderSync, parse3DTileTablesSync} from './helpers/parse-3d-tile-tables';
import {parse3DTileGLTFViewSync, extractGLTF} from './helpers/parse-3d-tile-gltf-view';

export async function parseInstancedModel3DTile(tile, arrayBuffer, byteOffset, options, context) {
  byteOffset = parseInstancedModel(tile, arrayBuffer, byteOffset, options, context);
  await extractGLTF(tile, tile.gltfFormat, options, context);
  return byteOffset;
}

function parseInstancedModel(tile, arrayBuffer, byteOffset, options, context) {
  byteOffset = parse3DTileHeaderSync(tile, arrayBuffer, byteOffset, options);
  if (tile.version !== 1) {
    throw new Error(`Instanced 3D Model version ${tile.version} is not supported`);
  }

  byteOffset = parse3DTileTablesHeaderSync(tile, arrayBuffer, byteOffset, options);

  const view = new DataView(arrayBuffer);

  tile.gltfFormat = view.getUint32(byteOffset, true);
  byteOffset += 4;

  // PARSE FEATURE TABLE
  byteOffset = parse3DTileTablesSync(tile, arrayBuffer, byteOffset, options);

  byteOffset = parse3DTileGLTFViewSync(tile, arrayBuffer, byteOffset, options);

  // TODO - Is the feature table sometimes optional or can check be moved into table header parser?
  if (tile.featureTableJsonByteLength === 0) {
    throw new Error('i3dm parser: featureTableJsonByteLength is zero.');
  }

  const featureTable = new Tile3DFeatureTable(tile.featureTableJson, tile.featureTableBinary);

  const instancesLength = featureTable.getGlobalProperty('INSTANCES_LENGTH');
  featureTable.featuresLength = instancesLength;

  if (!Number.isFinite(instancesLength)) {
    throw new Error('i3dm parser: INSTANCES_LENGTH must be defined');
  }

  tile.eastNorthUp = featureTable.getGlobalProperty('EAST_NORTH_UP');
  tile.rtcCenter = featureTable.getGlobalProperty('RTC_CENTER', GL.FLOAT, 3);

  const batchTable = new Tile3DBatchTable(
    tile.batchTableJson,
    tile.batchTableBinary,
    instancesLength
  );

  extractInstancedAttributes(tile, featureTable, batchTable, instancesLength);

  return byteOffset;
}

// eslint-disable-next-line max-statements, complexity
function extractInstancedAttributes(tile, featureTable, batchTable, instancesLength) {
  // Create model instance collection
  const collectionOptions = {
    instances: new Array(instancesLength),
    batchTable: tile._batchTable,
    cull: false, // Already culled by 3D Tiles
    url: undefined,
    // requestType: RequestType.TILES3D,
    gltf: undefined,
    basePath: undefined,
    incrementallyLoadTextures: false,
    // TODO - tileset is not available at this stage, tile is parsed independently
    // upAxis: (tileset && tileset._gltfUpAxis) || [0, 1, 0],
    forwardAxis: [1, 0, 0]
  };

  const instances = collectionOptions.instances;
  const instancePosition = new Vector3();
  const instanceNormalRight = new Vector3();
  const instanceNormalUp = new Vector3();
  const instanceNormalForward = new Vector3();
  const instanceRotation = new Matrix3();
  const instanceQuaternion = new Quaternion();
  const instanceScale = new Vector3();
  const instanceTranslationRotationScale = {};
  const instanceTransform = new Matrix4();
  const scratch1 = [];
  const scratch2 = [];
  const scratchVector1 = new Vector3();
  const scratchVector2 = new Vector3();

  for (let i = 0; i < instancesLength; i++) {
    let position;

    // Get the instance position
    if (featureTable.hasProperty('POSITION')) {
      position = featureTable.getProperty('POSITION', GL.FLOAT, 3, i, instancePosition);
    } else if (featureTable.hasProperty('POSITION_QUANTIZED')) {
      position = featureTable.getProperty(
        'POSITION_QUANTIZED',
        GL.UNSIGNED_SHORT,
        3,
        i,
        instancePosition
      );

      const quantizedVolumeOffset = featureTable.getGlobalProperty(
        'QUANTIZED_VOLUME_OFFSET',
        GL.FLOAT,
        3,
        scratchVector1
      );
      if (!quantizedVolumeOffset) {
        throw new Error(
          'i3dm parser: QUANTIZED_VOLUME_OFFSET must be defined for quantized positions.'
        );
      }

      const quantizedVolumeScale = featureTable.getGlobalProperty(
        'QUANTIZED_VOLUME_SCALE',
        GL.FLOAT,
        3,
        scratchVector2
      );
      if (!quantizedVolumeScale) {
        throw new Error(
          'i3dm parser: QUANTIZED_VOLUME_SCALE must be defined for quantized positions.'
        );
      }

      const MAX_UNSIGNED_SHORT = 65535.0;
      for (let j = 0; j < 3; j++) {
        position[j] =
          (position[j] / MAX_UNSIGNED_SHORT) * quantizedVolumeScale[j] + quantizedVolumeOffset[j];
      }
    }

    if (!position) {
      throw new Error('i3dm: POSITION or POSITION_QUANTIZED must be defined for each instance.');
    }

    instancePosition.copy(position);
    instanceTranslationRotationScale.translation = instancePosition;

    // Get the instance rotation
    tile.normalUp = featureTable.getProperty('NORMAL_UP', GL.FLOAT, 3, i, scratch1);
    tile.normalRight = featureTable.getProperty('NORMAL_RIGHT', GL.FLOAT, 3, i, scratch2);

    const hasCustomOrientation = false;
    if (tile.normalUp) {
      if (!tile.normalRight) {
        throw new Error('i3dm: Custom orientation requires both NORMAL_UP and NORMAL_RIGHT.');
      }
      // Vector3.unpack(normalUp, 0, instanceNormalUp);
      // Vector3.unpack(normalRight, 0, instanceNormalRight);
      tile.hasCustomOrientation = true;
    } else {
      tile.octNormalUp = featureTable.getProperty(
        'NORMAL_UP_OCT32P',
        GL.UNSIGNED_SHORT,
        2,
        scratch1
      );
      tile.octNormalRight = featureTable.getProperty(
        'NORMAL_RIGHT_OCT32P',
        GL.UNSIGNED_SHORT,
        2,
        scratch2
      );

      if (tile.octNormalUp) {
        if (!tile.octNormalRight) {
          throw new Error(
            'i3dm: oct-encoded orientation requires NORMAL_UP_OCT32P and NORMAL_RIGHT_OCT32P'
          );
        }

        throw new Error('i3dm: oct-encoded orientation not implemented');
        /*
        AttributeCompression.octDecodeInRange(octNormalUp[0], octNormalUp[1], 65535, instanceNormalUp);
        AttributeCompression.octDecodeInRange(octNormalRight[0], octNormalRight[1], 65535, instanceNormalRight);
        hasCustomOrientation = true;
        */
      } else if (tile.eastNorthUp) {
        Ellipsoid.WGS84.eastNorthUpToFixedFrame(instancePosition, instanceTransform);
        instanceTransform.getRotationMatrix3(instanceRotation);
      } else {
        instanceRotation.identity();
      }
    }

    if (hasCustomOrientation) {
      instanceNormalForward
        .copy(instanceNormalRight)
        .cross(instanceNormalUp)
        .normalize();
      instanceRotation.setColumn(0, instanceNormalRight);
      instanceRotation.setColumn(1, instanceNormalUp);
      instanceRotation.setColumn(2, instanceNormalForward);
    }

    instanceQuaternion.fromMatrix3(instanceRotation);
    instanceTranslationRotationScale.rotation = instanceQuaternion;

    // Get the instance scale
    instanceScale.set(1.0, 1.0, 1.0);
    const scale = featureTable.getProperty('SCALE', GL.FLOAT, 1, i);
    if (Number.isFinite(scale)) {
      instanceScale.multiplyByScalar(scale);
    }
    const nonUniformScale = featureTable.getProperty('SCALE_NON_UNIFORM', GL.FLOAT, 3, i, scratch1);
    if (nonUniformScale) {
      instanceScale.scale(nonUniformScale);
    }

    instanceTranslationRotationScale.scale = instanceScale;

    // Get the batchId
    let batchId = featureTable.getProperty('BATCH_ID', GL.UNSIGNED_SHORT, 1, i);
    if (batchId === undefined) {
      // If BATCH_ID semantic is undefined, batchId is just the instance number
      batchId = i;
    }

    const rotationMatrix = new Matrix4().fromQuaternion(instanceTranslationRotationScale.rotation);

    // Create the model matrix and the instance
    instanceTransform.identity();
    instanceTransform.translate(instanceTranslationRotationScale.translation);
    instanceTransform.multiplyRight(rotationMatrix);
    instanceTransform.scale(instanceTranslationRotationScale.scale);

    const modelMatrix = instanceTransform.clone();
    instances[i] = {
      modelMatrix,
      batchId
    };
  }

  tile.instances = instances;
}
