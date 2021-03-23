/* global Cesium */
import {loadTileset} from './tileset-loader';

// This is taken from this blog: https://cesium.com/blog/2019/08/06/webodm-ships-with-cesium-ion/
// Data captured by American Red Cross.
/* eslint-disable no-unused-vars */
const malalisonToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0MTQ0NTNiOC0wNzlmLTQ1ZGEtYjM3Yi05ZmJlY2FiMmRjYWMiLCJpZCI6MTMxNTEsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NjI2OTQ3NTh9.tlqEVzzO25Itcla4jD17yywNFvAVM-aNVduzF6ss-1g';
Cesium.Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWMxMzcyYy0zZjJkLTQwODctODNlNi01MDRkZmMzMjIxOWIiLCJpZCI6OTYyMCwic2NvcGVzIjpbImFzbCIsImFzciIsImdjIl0sImlhdCI6MTU2Mjg2NjI3M30.1FNiClUyk00YH_nWfSGpiQAjR5V2OvREDq1PJ5QMjWQ';
const MELBOURNE_ION_ASSET_ID = 43978;
const CAIRO_ASSET_ID = 29328;
const MALALISON_ISLAND_ASSET_ID = 34014;
/* eslint-enable no-unused-vars */
const VIEW_TYPES = {SINGLE: 0, SIDE_BY_SIDE: 1};

// Application settings.
const VIEW_MODE = VIEW_TYPES.SIDE_BY_SIDE;
const TOKEN = Cesium.Ion.defaultAccessToken;
const ASSET_ID = CAIRO_ASSET_ID;

if (VIEW_MODE === VIEW_TYPES.SINGLE) {
  // Just use the Loaders.gl traversal
  const viewer = new Cesium.Viewer('loadersViewer');

  document.querySelector('#cesiumViewer').style.display = 'none';

  loadTileset({
    ionAssetId: ASSET_ID,
    ionAccessToken: TOKEN,
    viewerInstance: viewer
  });
} else if (VIEW_MODE === VIEW_TYPES.SIDE_BY_SIDE) {
  // Set the viewer on the left to be using LoadersGL loading & traversal,
  // and the right viewer using CesiumJS's built in loading & traversal.

  const loadersViewer = new Cesium.Viewer('loadersViewer');

  loadTileset({
    ionAssetId: ASSET_ID,
    ionAccessToken: TOKEN,
    viewerInstance: loadersViewer
  });

  const cesiumViewer = new Cesium.Viewer('cesiumViewer');
  cesiumViewer.scene.primitives.add(
    new Cesium.Cesium3DTileset({
      url: Cesium.IonResource.fromAssetId(ASSET_ID, {accessToken: TOKEN})
    })
  );

  // Sync the two views
  loadersViewer.camera.percentageChanged = 0.01;
  loadersViewer.camera.changed.addEventListener(() =>
    syncCameras(loadersViewer.camera, cesiumViewer.camera)
  );

  cesiumViewer.camera.percentageChanged = 0.01;
  cesiumViewer.camera.changed.addEventListener(() =>
    syncCameras(cesiumViewer.camera, loadersViewer.camera)
  );
}

function syncCameras(sourceCamera, sinkCamera) {
  // This copies sourceCamera's state onto sinkCamera's.
  sinkCamera.setView({
    destination: sourceCamera.position,
    orientation: {
      heading: sourceCamera.heading,
      pitch: sourceCamera.pitch,
      roll: sourceCamera.roll
    }
  });
}
