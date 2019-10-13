/* global Cesium, fetch */

import {Vector3} from 'math.gl';
import {registerLoaders, setLoaderOptions} from '@loaders.gl/core';
import {DracoLoader} from '@loaders.gl/draco';
import {Tileset3D, _getIonTilesetMetadata} from '@loaders.gl/3d-tiles';
import {Plane} from '@math.gl/culling';
import {loadBatchedModelTile, loadPointTile} from './tile-parsers';

// set up loaders
registerLoaders([DracoLoader]);
setLoaderOptions({worker: false});

// This is taken from this blog: https://cesium.com/blog/2019/08/06/webodm-ships-with-cesium-ion/
// Data captured by American Red Cross.
const malalisonToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0MTQ0NTNiOC0wNzlmLTQ1ZGEtYjM3Yi05ZmJlY2FiMmRjYWMiLCJpZCI6MTMxNTEsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NjI2OTQ3NTh9.tlqEVzzO25Itcla4jD17yywNFvAVM-aNVduzF6ss-1g';

// Ion assets
Cesium.Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWMxMzcyYy0zZjJkLTQwODctODNlNi01MDRkZmMzMjIxOWIiLCJpZCI6OTYyMCwic2NvcGVzIjpbImFzbCIsImFzciIsImdjIl0sImlhdCI6MTU2Mjg2NjI3M30.1FNiClUyk00YH_nWfSGpiQAjR5V2OvREDq1PJ5QMjWQ';
const MELBOURNE_ION_ASSET_ID = 43978; // eslint-disable-line
const CAIRO_ASSET_ID = 29328; // eslint-disable-line
const MALALISON_ISLAND_ASSET_ID = 34014;

// const VIEW_TYPES = {SINGLE: 0, SIDE_BY_SIDE: 1};
// const VIEW_MODE = VIEW_TYPES.SINGLE;

const viewer = new Cesium.Viewer('cesiumContainer');
const tileMap = {}; // Map the contentUri -> tile so we can unload/set visibility based on loaders.gl's tile events.

loadTileset({
  ionAssetId: MALALISON_ISLAND_ASSET_ID,
  ionAccessToken: malalisonToken
  // ionAccessToken: Cesium.Ion.defaultAccessToken
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
    onTileLoad: tileHeader => loadTile(tileHeader.uri, tileHeader),
    onTileUnload: tileHeader => unloadTile(tileHeader.contentUri),
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
  viewer.camera.flyTo({
    destination: new Cesium.Cartesian3(...tileset.cartesianCenter),
    duration: 3
  });
}

function loadTile(uri, tileHeader) {
  const type = uri.replace(/\?[\w\W]+/, '').slice(-4); // Make sure to remove query parameters.

  switch (type) {
    case 'pnts':
      loadPointTile(uri, tileHeader).then(renderTilePrimitive);
      break;
    case 'b3dm':
      loadBatchedModelTile(uri, tileHeader).then(renderTilePrimitive);
      break;
    default:
      console.log(`${type} is not implemented.`); // eslint-disable-line
  }
}

// TODO, hook this up to Tileset3D's tile visible event when that's ready.
// function setTileVisible(contentUri, visibility) {
//   tileMap[contentUri].show = visibility;
// }

function unloadTile(contentUri) {
  viewer.scene.primitives.remove(tileMap[contentUri]);
  delete tileMap[contentUri];
}

function renderTilePrimitive({primitive, tileHeader}) {
  tileMap[tileHeader.contentUri] = primitive;
  viewer.scene.primitives.add(primitive);
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
