import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';
import {SceneLayer3D} from '@loaders.gl/i3s';
import {createSceneServer} from '../../../src/i3s-server/utils/create-scene-server';

test('tile-converter(i3s-server)#createSceneServer', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }

  const result = await createSceneServer('Buildings_3D_Multipatch_DA12_Subset', LAYER);
  t.equals(JSON.stringify(result).length, 4898);

  t.end();
});

const LAYER: SceneLayer3D = {
  id: 0,
  version: 'ECB1F245-BAB6-4CF3-86CE-9CF6047E9239',
  name: 'Buildings_3D_Multipatch_DA12_Subset',
  serviceUpdateTimeStamp: {lastUpdate: 1570746568000},
  href: './layers/0',
  layerType: '3DObject',
  spatialReference: {wkid: 4326, latestWkid: 4326, vcsWkid: 5773, latestVcsWkid: 5773},
  heightModelInfo: {
    heightModel: 'gravity_related_height',
    vertCRS: 'EGM96_Geoid',
    heightUnit: 'meter'
  },
  ZFactor: 0.30480060960121924,
  alias: 'Buildings_3D_Multipatch_DA12_Subset',
  description: 'Buildings_3D_Multipatch_DA12_Subset',
  capabilities: ['View', 'Query'],
  cachedDrawingInfo: {color: false},
  popupInfo: {
    title: '{BIN}',
    mediaInfos: [],
    fieldInfos: [
      {fieldName: 'OBJECTID', visible: true, isEditable: false, label: 'OBJECTID'},
      {fieldName: 'BIN', visible: true, isEditable: true, label: 'BIN'},
      {fieldName: 'DOITT_ID', visible: true, isEditable: true, label: 'DOITT_ID'},
      {fieldName: 'SOURCE_ID', visible: true, isEditable: true, label: 'SOURCE_ID'}
    ],
    popupElements: [
      {
        fieldInfos: [
          {fieldName: 'OBJECTID', visible: true, isEditable: false, label: 'OBJECTID'},
          {fieldName: 'BIN', visible: true, isEditable: true, label: 'BIN'},
          {fieldName: 'DOITT_ID', visible: true, isEditable: true, label: 'DOITT_ID'},
          {fieldName: 'SOURCE_ID', visible: true, isEditable: true, label: 'SOURCE_ID'}
        ],
        type: 'fields'
      }
    ],
    expressionInfos: []
  },
  disablePopup: false,
  fields: [
    {name: 'OBJECTID', type: 'esriFieldTypeOID', alias: 'OBJECTID'},
    {name: 'BIN', type: 'esriFieldTypeInteger', alias: 'BIN'},
    {name: 'DOITT_ID', type: 'esriFieldTypeInteger', alias: 'DOITT_ID'},
    {name: 'SOURCE_ID', type: 'esriFieldTypeDouble', alias: 'SOURCE_ID'}
  ],
  statisticsInfo: [
    {key: 'f_1', name: 'BIN', href: './statistics/f_1/0'},
    {key: 'f_2', name: 'DOITT_ID', href: './statistics/f_2/0'},
    {key: 'f_3', name: 'SOURCE_ID', href: './statistics/f_3/0'}
  ],
  attributeStorageInfo: [
    {
      key: 'f_0',
      name: 'OBJECTID',
      header: [{property: 'count', valueType: 'UInt32'}],
      ordering: ['attributeValues'],
      attributeValues: {valueType: 'Oid32', valuesPerElement: 1}
    },
    {
      key: 'f_1',
      name: 'BIN',
      header: [{property: 'count', valueType: 'UInt32'}],
      ordering: ['attributeValues'],
      attributeValues: {valueType: 'Int32', valuesPerElement: 1}
    },
    {
      key: 'f_2',
      name: 'DOITT_ID',
      header: [{property: 'count', valueType: 'UInt32'}],
      ordering: ['attributeValues'],
      attributeValues: {valueType: 'Int32', valuesPerElement: 1}
    },
    {
      key: 'f_3',
      name: 'SOURCE_ID',
      header: [{property: 'count', valueType: 'UInt32'}],
      ordering: ['attributeValues'],
      attributeValues: {valueType: 'Float64', valuesPerElement: 1}
    }
  ],
  store: {
    id: 'D20A5DA0-623B-4359-880D-474D634F7158',
    profile: 'meshpyramids',
    resourcePattern: ['3dNodeIndexDocument', 'Attributes', 'SharedResource', 'Geometry'],
    rootNode: './nodes/root',
    extent: [
      -74.01610254118118348, 40.70883303940371434, -74.00660086904034074, 40.71625626184324886
    ],
    indexCRS: 'http://www.opengis.net/def/crs/EPSG/0/4326',
    vertexCRS: 'http://www.opengis.net/def/crs/EPSG/0/4326',
    normalReferenceFrame: 'earth-centered',
    nidEncoding: 'application/vnd.esri.i3s.json+gzip; version=1.7',
    featureEncoding: 'application/vnd.esri.i3s.json+gzip; version=1.7',
    geometryEncoding: 'application/octet-stream; version=1.7',
    attributeEncoding: 'application/octet-stream; version=1.7',
    lodType: 'MeshPyramid',
    lodModel: 'node-switching',
    defaultGeometrySchema: {
      geometryType: 'triangles',
      header: [
        {property: 'vertexCount', type: 'UInt32'},
        {property: 'featureCount', type: 'UInt32'}
      ],
      topology: 'PerAttributeArray',
      ordering: ['position', 'normal', 'uv0', 'color'],
      vertexAttributes: {
        position: {valueType: 'Float32', valuesPerElement: 3},
        normal: {valueType: 'Float32', valuesPerElement: 3},
        uv0: {valueType: 'Float32', valuesPerElement: 2},
        color: {valueType: 'UInt8', valuesPerElement: 4}
      },
      featureAttributeOrder: ['id', 'faceRange'],
      featureAttributes: {
        id: {valueType: 'UInt64', valuesPerElement: 1},
        faceRange: {valueType: 'UInt32', valuesPerElement: 2}
      }
    },
    textureEncoding: ['image/jpeg', 'image/vnd-ms.dds'],
    version: '1.7'
  },
  nodePages: {nodesPerPage: 64, lodSelectionMetricType: 'maxScreenThresholdSQ'},
  materialDefinitions: [],
  geometryDefinitions: [
    {
      topology: 'PerAttributeArray',
      geometryBuffers: [
        {
          offset: 8,
          position: {type: 'Float32', component: 3, binding: 'per-vertex'},
          normal: {type: 'Float32', component: 3, binding: 'per-vertex'},
          uv0: {type: 'Float32', component: 2, binding: 'per-vertex'},
          color: {type: 'UInt8', component: 4, binding: 'per-vertex'},
          featureId: {type: 'UInt64', component: 1, binding: 'per-feature'},
          faceRange: {type: 'UInt32', component: 2, binding: 'per-feature'}
        },
        {
          compressedAttributes: {
            encoding: 'draco',
            attributes: ['position', 'uv0', 'color', 'feature-index']
          }
        }
      ]
    }
  ]
};
