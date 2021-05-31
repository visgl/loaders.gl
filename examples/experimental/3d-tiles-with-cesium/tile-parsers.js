/* global Cesium */
import {load} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';

const Axis = Cesium.Axis;
const Cartesian3 = Cesium.Cartesian3;
const defined = Cesium.defined;
const TileOrientedBoundingBox = Cesium.TileOrientedBoundingBox;
const Matrix3 = Cesium.Matrix3;
const Matrix4 = Cesium.Matrix4;
const Model = Cesium.Model;
const Resource = Cesium.Resource;
const PointCloud = Cesium.PointCloud;
const Pass = Cesium.Pass;

function getBoundingSphere(tileHeader) {
  const center = tileHeader.boundingVolume.center;
  const halfAxes = tileHeader.boundingVolume.halfAxes;

  const boundingVolume = new TileOrientedBoundingBox(
    new Cartesian3(center.x, center.y, center.z),
    Matrix3.fromColumnMajorArray(halfAxes)
  );

  return boundingVolume._boundingSphere;
}

function getTransform(tileHeader) {
  return Matrix4.fromColumnMajorArray(tileHeader.computedTransform);
}

export function loadPointTile(uri, tileHeader) {
  const boundingSphere = getBoundingSphere(tileHeader);
  const computedTransform = getTransform(tileHeader);

  return Resource.fetchArrayBuffer(uri).then(function(arrayBuffer) {
    const pointCloud = new PointCloud({
      arrayBuffer,
      byteOffset: 0,
      cull: false,
      opaquePass: Pass.CESIUM_3D_TILE,
      vertexShaderLoaded: vs => vs,
      fragmentShaderLoaded: fs => `uniform vec4 czm_pickColor;\n${fs}`,
      uniformMapLoaded: uniformMap => uniformMap,
      batchTableLoaded: (batchLength, batchTableJson, batchTableBinary) => {},
      pickIdLoaded: () => 'czm_pickColor'
    });

    pointCloud.boundingSphere = boundingSphere;
    pointCloud.modelMatrix = computedTransform;

    return {
      primitive: pointCloud,
      tileHeader
    };
  });
}

export async function loadBatchedModelTile(uri, tileHeader) {
  const computedTransform = getTransform(tileHeader);

  const content = await load(uri, Tiles3DLoader, {
    '3d-tiles': {
      loadGLTF: false
    }
  });

  if (defined(content.rtcCenter)) {
    const rtcCenterTransform = Matrix4.fromTranslation(Cartesian3.fromArray(content.rtcCenter));
    Matrix4.multiply(computedTransform, rtcCenterTransform, computedTransform);
  }

  const model = new Model({
    gltf: content.gltfArrayBuffer,
    cull: false,
    releaseGltfJson: true,
    opaquePass: Pass.CESIUM_3D_TILE,
    modelMatrix: computedTransform,
    upAxis: Axis.Y,
    forwardAxis: Axis.X
  });

  return {
    primitive: model,
    tileHeader
  };
}
