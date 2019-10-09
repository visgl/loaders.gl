/* global Cesium, fetch */

import {Vector3} from 'math.gl';
import {registerLoaders, setLoaderOptions} from '@loaders.gl/core';
import {DracoLoader} from '@loaders.gl/draco';
import {Tileset3D, _getIonTilesetMetadata} from '@loaders.gl/3d-tiles';
import {Plane} from '@math.gl/culling';

// set up loaders
registerLoaders([DracoLoader]);
setLoaderOptions({worker: false});

// Ion asset
Cesium.Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWMxMzcyYy0zZjJkLTQwODctODNlNi01MDRkZmMzMjIxOWIiLCJpZCI6OTYyMCwic2NvcGVzIjpbImFzbCIsImFzciIsImdjIl0sImlhdCI6MTU2Mjg2NjI3M30.1FNiClUyk00YH_nWfSGpiQAjR5V2OvREDq1PJ5QMjWQ';
const MELBOURNE_ION_ASSET_ID = 43978;

const INITIAL_VIEW_STATE = {
  direction: [-0.13038111167390576, 0.09148571979975412, 0.9872340800394797],
  up: [-0.8081356152768331, 0.5670519871339241, -0.1592760848608561]
};

const viewer = new Cesium.Viewer('cesiumContainer');

loadTileset({
  ionAssetId: MELBOURNE_ION_ASSET_ID,
  ionAccessToken: Cesium.Ion.defaultAccessToken
});

async function loadTileset({tilesetUrl, ionAssetId, ionAccessToken}) {
  let fetchOptions = null;
  if (ionAssetId && ionAccessToken) {
    const {url, headers} = await _getIonTilesetMetadata(ionAccessToken, ionAssetId);
    tilesetUrl = url;
    fetchOptions = {headers};
  }

  const response = await fetch(tilesetUrl, fetchOptions);
  const tilesetJson = await response.json();

  const tileset3d = new Tileset3D(tilesetJson, tilesetUrl, {
    onTileLoad: tileHeader => loadPnts(tileHeader.uri, tileHeader),
    onTileUnload: tileHeader => console.log('Unload', tileHeader.uri), // eslint-disable-line
    onTileLoadFailed: tileHeader => console.error('LoadFailed', tileHeader.uri), // eslint-disable-line
    fetchOptions,
    throttleRequests: true
  });

  centerTileset(tileset3d);

  viewer.scene.preRender.addEventListener(scene => {
    const frameState = convertCesiumFrameState(scene.frameState, scene.canvas.height);
    tileset3d.update(frameState);
  });
}

function centerTileset(tileset) {
  // destination: new Cesium.Cartesian3(-4129177.4436845127, 2897358.104762894, -3895489.035314936),
  viewer.camera.flyTo({
    destination: new Cesium.Cartesian3(...tileset.cartesianCenter),
    orientation: {
      direction: new Cesium.Cartesian3(...INITIAL_VIEW_STATE.direction),
      up: new Cesium.Cartesian3(...INITIAL_VIEW_STATE.up)
    },
    duration: 3
  });
}

function loadPnts(pntsUrl, tileHeader) {
  const center = tileHeader.boundingVolume.center;
  const halfAxes = tileHeader.boundingVolume.halfAxes;

  const boundingVolume = new Cesium.TileOrientedBoundingBox(
    new Cesium.Cartesian3(center.x, center.y, center.z),
    Cesium.Matrix3.fromColumnMajorArray(halfAxes)
  );

  const boundingSphere = boundingVolume._boundingSphere;
  const computedTransform = Cesium.Matrix4.fromColumnMajorArray(tileHeader.computedTransform);

  Cesium.Resource.fetchArrayBuffer(pntsUrl).then(function(arrayBuffer) {
    const pointCloud = new Cesium.PointCloud({
      arrayBuffer,
      byteOffset: 0,
      cull: false,
      opaquePass: Cesium.Pass.CESIUM_3D_TILE,
      vertexShaderLoaded: vs => vs,
      fragmentShaderLoaded: fs => `uniform vec4 czm_pickColor;\n${fs}`,
      uniformMapLoaded: uniformMap => uniformMap,
      batchTableLoaded: (batchLength, batchTableJson, batchTableBinary) => {},
      pickIdLoaded: () => 'czm_pickColor'
    });

    viewer.scene.primitives.add(pointCloud);

    pointCloud.boundingSphere = boundingSphere;
    pointCloud.modelMatrix = computedTransform;
  });
}

function convertCesiumFrameState(frameState, height) {
  let cameraPosition = frameState.camera.position;
  cameraPosition = new Vector3([cameraPosition.x, cameraPosition.y, cameraPosition.z]);

  let cameraDirection = frameState.camera.direction;
  cameraDirection = new Vector3([cameraDirection.x, cameraDirection.y, cameraDirection.z]);

  let cameraUp = frameState.camera.up;
  cameraUp = new Vector3([cameraUp.x, cameraUp.y, cameraUp.z]);

  const planes = frameState.cullingVolume.planes.map(
    plane => new Plane([plane.x, plane.y, plane.z], plane.w)
  );

  return {
    camera: {
      position: cameraPosition,
      direction: cameraDirection,
      up: cameraUp
    },
    height,
    // TODO update when math.gl published
    cullingVolume: {planes},
    frameNumber: frameState.frameNumber, // TODO: This can be the same between updates, what number is unique for between updates?
    sseDenominator: frameState.camera.frustum.sseDenominator
  };
}
