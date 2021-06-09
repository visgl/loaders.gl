export const STORE = {
  id: {
    path: 'id',
    transform: (val) => val.toUpperCase()
  },
  profile: {
    path: 'profile',
    default: 'meshpyramids'
  },
  version: {
    path: 'version',
    default: '1.7'
  },
  resourcePattern: {
    path: 'resourcePattern',
    default: ['3dNodeIndexDocument', 'Attributes', 'SharedResource', 'Geometry']
  },
  rootNode: {
    path: 'rootNode',
    default: './nodes/root'
  },
  extent: {
    path: 'extent'
  },
  indexCRS: {
    path: 'indexCRS',
    default: 'http://www.opengis.net/def/crs/EPSG/0/4326'
  },
  vertexCRS: {
    path: 'vertexCRS',
    default: 'http://www.opengis.net/def/crs/EPSG/0/4326'
  },
  normalReferenceFrame: {
    path: 'normalReferenceFrame',
    default: 'east-north-up'
  },
  attributeEncoding: {
    path: 'attributeEncoding',
    default: 'application/octet-stream; version=1.6'
  },
  textureEncoding: {
    path: 'textureEncoding',
    default: ['image/jpeg']
  },
  lodType: {
    path: 'lodType',
    default: 'MeshPyramid'
  },
  lodModel: {
    path: 'lodModel',
    default: 'node-switching'
  },
  defaultGeometrySchema: {
    path: 'defaultGeometrySchema',
    default: {
      geometryType: 'triangles',
      header: [
        {
          property: 'vertexCount',
          type: 'UInt32'
        },
        {
          property: 'featureCount',
          type: 'UInt32'
        }
      ],
      topology: 'PerAttributeArray',
      ordering: ['position', 'normal', 'uv0', 'color'],
      vertexAttributes: {
        position: {
          valueType: 'Float32',
          valuesPerElement: 3
        },
        normal: {
          valueType: 'Float32',
          valuesPerElement: 3
        },
        uv0: {
          valueType: 'Float32',
          valuesPerElement: 2
        },
        color: {
          valueType: 'UInt8',
          valuesPerElement: 4
        }
      },
      featureAttributeOrder: ['id', 'faceRange'],
      featureAttributes: {
        id: {
          valueType: 'UInt64',
          valuesPerElement: 1
        },
        faceRange: {
          valueType: 'UInt32',
          valuesPerElement: 2
        }
      }
    }
  }
};
