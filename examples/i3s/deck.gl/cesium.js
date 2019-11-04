/* global Cesium */

Cesium.Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWMxMzcyYy0zZjJkLTQwODctODNlNi01MDRkZmMzMjIxOWIiLCJpZCI6OTYyMCwic2NvcGVzIjpbImFzbCIsImFzciIsImdjIl0sImlhdCI6MTU2Mjg2NjI3M30.1FNiClUyk00YH_nWfSGpiQAjR5V2OvREDq1PJ5QMjWQ';
let viewer = null;
function getViewer() {
  if (viewer){
    return viewer;
  }

  viewer = new Cesium.Viewer('cesium-viewer');
  viewer.camera.percentageChanged = 0.01;
  viewer.scene.primitives.destroyPrimitives = true

  return viewer;
}


export function centerMap(viewport) {
  const {longitude, latitude, pitch = 45, bearing = 0} = viewport;
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 1500),
    orientation: {
      heading: Cesium.Math.toRadians(bearing),
      pitch: Cesium.Math.toRadians(-pitch),
      roll: 0
    }
  });
}

const tileMap = {};

export function cesiumUnload(tileId) {
  const cesiumViewer = getViewer();
  cesiumViewer.scene.primitives.remove(tileMap[tileId]);
  delete tileMap[tileId];
}

export function cesiumRender(viewport, tile) {
  const {
    texture,
    attributes: {id, position, normal, color, uv0}
  } = tile;

  const geometry = new Cesium.Geometry({
    attributes: {
      position: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.DOUBLE,
        componentsPerAttribute: 3,
        values: position.value
      }),
      normal: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.FLOAT,
        componentsPerAttribute: 3,
        values: normal.value
      }),
      // color: new Cesium.GeometryAttribute({
      //   componentDatatype: Cesium.ComponentDatatype.UNSIGNED_BYTE,
      //   componentsPerAttribute: 4,
      //   values: color.value,
      //   normalize: true
      // }),
      st: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.FLOAT,
        componentsPerAttribute: 2,
        values: uv0.value
      })
    },
    primitiveType: Cesium.PrimitiveType.TRIANGLES,
    boundingSphere: Cesium.BoundingSphere.fromVertices(position.value)
  });

  const geoInstance = new Cesium.GeometryInstance({
    geometry: geometry,
    show: new Cesium.ShowGeometryInstanceAttribute(true),
    id
  });

  const primitive = new Cesium.Primitive({
    geometryInstances: [geoInstance],
    // appearance: new Cesium.PerInstanceColorAppearance({
    //   flat: true,
    //   translucent: false
    // }),
    appearance: new Cesium.MaterialAppearance({
      translucent: false,
      closed: true,
      material: new Cesium.Material({
        fabric: {
          type: 'Image',
          uniforms: {
            image: texture
          }
        }
      })
    }),
    interleave: false,
    vertexCacheOptimize: true,
    compressVertices: true,
    releaseGeometryInstances: false,
    allowPicking: true,
  });
  primitive.id = geoInstance.id;
  primitive.mbs = geoInstance.mbs;
  primitive.level = geoInstance.level;

  tileMap[tile.id] = primitive;

  const cesiumViewer = getViewer();
  cesiumViewer.scene.primitives.add(primitive);
}
