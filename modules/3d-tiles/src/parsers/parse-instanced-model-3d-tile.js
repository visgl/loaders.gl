import {GL} from '../constants';
import Tile3DFeatureTable from '../tile-3d-feature-table';
import Tile3DBatchTable from '../tile-3d-batch-table';

import {parse3DTileHeaderSync} from './parse-3d-file-header';
import {parse3DTileTablesHeaderSync, parse3DTileTablesSync} from './parse-3d-file-header';
import {parse3DTileGLTFViewSync} from './parse-3d-gltf-view';

// Reference code:
// https://github.com/AnalyticalGraphicsInc/cesium/blob/master/Source/Scene/Instanced3DModel3DTileContent.js#L190
export default function parseInstancedModel3DTileSync(tile, arrayBuffer, byteOffset, options) {
  byteOffset = parse3DTileHeaderSync(tile, arrayBuffer, byteOffset, options);
  if (tile.version !== 1) {
    throw new Error(`Instanced 3D Model version ${tile.version} is not supported`);
  }

  byteOffset = parse3DTileTablesHeaderSync(tile, arrayBuffer, byteOffset, options)

  tile.gltfFormat = view.getUint32(byteOffset, true);
  byteOffset += 4;

  // PARSE FEATURE TABLE
  byteOffset = parse3DTileTablesSync(tile, arrayBuffer, byteOffset, options);

  byteOffset = parseGLTFView(tile, byteOffset, byteStart)

  // TODO - Is the feature table sometimes optional or can check be moved into table header parser?
  if (tile.featureTableJsonByteLength === 0) {
    throw new Error('i3dm parser: featureTableJsonByteLength is zero.');
  }

  const featureTable = new Tile3DFeatureTable(tile);

  const instancesLength = featureTable.getGlobalProperty('INSTANCES_LENGTH');
  featureTable.featuresLength = instancesLength;

  if (!Number.isFinite(instancesLength)) {
    throw new Error('i3dm parser: INSTANCES_LENGTH must be defined');
  }

  const batchTable = new Tile3DBatchTable(tile, instancesLength);


  switch (tile.gltfFormat) {
  case 0:
    const gltfUrl = getStringFromTypedArray(tile.gltfView);
    // We need to remove padding from the end of the model URL in case this tile was part of a composite tile.
    // This removes all white space and null characters from the end of the string.
    tile.url = gltfUrl.replace(/[\s\0]+$/, '');
    throw new Error('i3dm: glTF format 0 (uri) not yet implemented');
    break;
  case 1:
    tile.gltf = gltfView;
    break;
  default:
    throw new Error(`i3dm: glTF format ${tile.gltfFormat}: Must be 0 (uri) or 1 (embedded)`);
  }


  tile.eastNorthUp = featureTable.getGlobalProperty('EAST_NORTH_UP');
  tile.rtcCenter = featureTable.getGlobalProperty('RTC_CENTER', GL.FLOAT, 3);

  extractInstancedAttributes(tile, featureTable);

  return byteOffset;
}

function extractInstancedAttributes(tile, featureTable, batchTable) {

  // Create model instance collection
  // const collectionOptions = {
  //   instances: new Array(instancesLength),
  //   batchTable: tile._batchTable,
  //   cull: false, // Already culled by 3D Tiles
  //   url: undefined,
  //   requestType: RequestType.TILES3D,
  //   gltf: undefined,
  //   basePath: undefined,
  //   incrementallyLoadTextures: false,
  //   upAxis: tileset._gltfUpAxis,
  //   forwardAxis: Axis.X,
  //   opaquePass: Pass.CESIUM_3D_TILE, // Draw opaque portions during the 3D Tiles pass
  //   pickIdLoaded: getPickIdCallback(tile),
  //   imageBasedLightingFactor: tileset.imageBasedLightingFactor,
  //   lightColor: tileset.lightColor,
  //   luminanceAtZenith: tileset.luminanceAtZenith,
  //   sphericalHarmonicCoefficients: tileset.sphericalHarmonicCoefficients,
  //   specularEnvironmentMaps: tileset.specularEnvironmentMaps
  // };

  const instances = collectionOptions.instances;
  const instancePosition = new Cartesian3();
  const instancePositionArray = new Array(3);
  const instanceNormalRight = new Cartesian3();
  const instanceNormalUp = new Cartesian3();
  const instanceNormalForward = new Cartesian3();
  const instanceRotation = new Matrix3();
  const instanceQuaternion = new Quaternion();const instanceScale = new Cartesian3(); const instanceTranslationRotationScale = new TranslationRotationScale(); const instanceTransform = new Matri   scratch1 = new Arr   scratch2 = new Array
  for (const i = 0; i < instancesLength; i++) {
    // Get the instance position
    if (featureTable.hasProperty('POSITION')) {

      tile.position = featureTable.getProperty('POSITION', GL.FLOAT, 3, i, scratch1);

    } else if (featureTable.hasProperty('POSITION_QUANTIZED')) {

      tile.position = instancePositionArray;
      tile.positionQuantized = featureTable.getProperty('POSITION_QUANTIZED',GL.UNSIGNED_SHORT, 3, scratch1);


      tile.quantizedVolumeOffset = featureTable.getGlobalProperty('QUANTIZED_VOLUME_OFFSET', GL.FLOAT, 3);
      if (!tile.quantizedVolumeOffset) {
        throw new Error('i3dm parser: QUANTIZED_VOLUME_OFFSET must be defined for quantized positions.');
      }

      const quantizedVolumeScale = featureTable.getGlobalProperty('QUANTIZED_VOLUME_SCALE', GL.FLOAT, 3);
      if (!tile.quantizedVolumeScale) {
        throw new Error('i3dm parser: QUANTIZED_VOLUME_SCALE must be defined for quantized positions.');
      }

      for (const j = 0; j < 3; j++) {
        position[j] = (positionQuantized[j] / 65535.0) * quantizedVolumeScale[j] + quantizedVolumeOffset[j];
      }
    }

    if (!tile.position)) {
      throw new Error('i3dm: POSITION or POSITION_QUANTIZED must be defined for each instance.');
    }

    Cartesian3.unpack(position, 0, instancePosition);
    if (defined(rtcCenter)) {
      Cartesian3.add(instancePosition, rtcCenter, instancePosition);
    }
    instanceTranslationRotationScale.translation = instancePosition;

    // Get the instance rotation
    tile.normalUp = featureTable.getProperty('NORMAL_UP', GL.FLOAT, 3, i, scratch1);
    tile.normalRight = featureTable.getProperty('NORMAL_RIGHT', GL.FLOAT, 3, i, scratch2);

    const hasCustomOrientation = false;
    if (tile.normalUp) {
      if (!tile.normalRight) {
        throw new Error('i3dm: Custom orientation requires both NORMAL_UP and NORMAL_RIGHT.');
      }
      // Cartesian3.unpack(normalUp, 0, instanceNormalUp);
      // Cartesian3.unpack(normalRight, 0, instanceNormalRight);
      tile.hasCustomOrientation = true;
    } else {
      tile.octNormalUp =
        featureTable.getProperty('NORMAL_UP_OCT32P', GL.UNSIGNED_SHORT, 2, scratch1);
      tile.octNormalRight =
        featureTable.getProperty('NORMAL_RIGHT_OCT32P', GL.UNSIGNED_SHORT, 2, scratch2);

      if (tile.octNormalUp) {
        if (!tile.octNormalRight) {
          throw new Error(
            'i3dm: oct-encoded orientation requires NORMAL_UP_OCT32P and NORMAL_RIGHT_OCT32P'
          );
        }

        AttributeCompression.octDecodeInRange(
          octNormalUp[0],
          octNormalUp[1],
          65535,
          instanceNormalUp
        );

        AttributeCompression.octDecodeInRange(
          octNormalRight[0],
          octNormalRight[1],
          65535,
          instanceNormalRight
        );

        hasCustomOrientation = true;

      } else if (eastNorthUp) {

        Transforms.eastNorthUpToFixedFrame(instancePosition, Ellipsoid.WGS84, instanceTransform);
        Matrix4.getRotation(instanceTransform, instanceRotation);

      } else {

        Matrix3.clone(Matrix3.IDENTITY, instanceRotation);

      }
    }

    if (hasCustomOrientation) {
      Cartesian3.cross(instanceNormalRight, instanceNormalUp, instanceNormalForward);
      Cartesian3.normalize(instanceNormalForward, instanceNormalForward);
      Matrix3.setColumn(instanceRotation, 0, instanceNormalRight, instanceRotation);
      Matrix3.setColumn(instanceRotation, 1, instanceNormalUp, instanceRotation);
      Matrix3.setColumn(instanceRotation, 2, instanceNormalForward, instanceRotation);
    }

    Quaternion.fromRotationMatrix(instanceRotation, instanceQuaternion);
    instanceTranslationRotationScale.rotation = instanceQuaternion;

    // Get the instance scale
    instanceScale = Cartesian3.fromElements(1.0, 1.0, 1.0, instanceScale);
    const scale = featureTable.getProperty('SCALE', GL.FLOAT, 1, i);
    if (defined(scale)) {
      Cartesian3.multiplyByScalar(instanceScale, scale, instanceScale);
    }
    const nonUniformScale = featureTable.getProperty('SCALE_NON_UNIFORM', GL.FLOAT, 3, i, scratch1);
    if (defined(nonUniformScale)) {
      instanceScale.x *= nonUniformScale[0];
      instanceScale.y *= nonUniformScale[1];
      instanceScale.z *= nonUniformScale[2];
    }
    instanceTranslationRotationScale.scale = instanceScale;

    // Get the batchId
    const batchId = featureTable.getProperty('BATCH_ID', GL.UNSIGNED_SHORT, 1, i);
    if (!defined(batchId)) {
      // If BATCH_ID semantic is undefined, batchId is just the instance number
      batchId = i;
    }

    // Create the model matrix and the instance
    Matrix4.fromTranslationRotationScale(instanceTranslationRotationScale, instanceTransform);
    const modelMatrix = instanceTransform.clone();
    instances[i] = {
      modelMatrix: modelMatrix,
      batchId: batchId
    };
  }

  tile._modelInstanceCollection = new ModelInstanceCollection(collectionOptions);
}
