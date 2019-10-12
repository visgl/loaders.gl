/* global Cesium */

Cesium.Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWMxMzcyYy0zZjJkLTQwODctODNlNi01MDRkZmMzMjIxOWIiLCJpZCI6OTYyMCwic2NvcGVzIjpbImFzbCIsImFzciIsImdjIl0sImlhdCI6MTU2Mjg2NjI3M30.1FNiClUyk00YH_nWfSGpiQAjR5V2OvREDq1PJ5QMjWQ';

const viewer = new Cesium.Viewer('cesium-viewer');

viewer.camera.percentageChanged = 0.01;
viewer.scene.primitives.destroyPrimitives = true;

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

export function cesiumRender(viewport, instances) {
  instances = instances.map((instance, i) => {
    const {
      attributes: {id, position, normal, color}
    } = instance;
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
        color: new Cesium.GeometryAttribute({
          componentDatatype: Cesium.ComponentDatatype.UNSIGNED_BYTE,
          componentsPerAttribute: 4,
          values: color.value,
          normalize: true
        })
      },
      primitiveType: Cesium.PrimitiveType.TRIANGLES,
      boundingSphere: Cesium.BoundingSphere.fromVertices(position.value)
    });
    return new Cesium.GeometryInstance({
      geometry: geometry,
      show: new Cesium.ShowGeometryInstanceAttribute(true),
      id
    });
  });

  const primitive = new Cesium.Primitive({
    geometryInstances: instances,
    appearance: new Cesium.PerInstanceColorAppearance({
      flat: true,
      translucent: false
    }),
    interleave: false,
    vertexCacheOptimize: true,
    compressVertices: true,
    releaseGeometryInstances: false,
    allowPicking: true
  });
  primitive.id = instances[0].id;
  primitive.mbs = instances[0].mbs;

  viewer.scene.primitives.add(primitive);
}
