// This file is derived from the potree code base under BSD 2-clause license
// https://github.com/potree/potree/blob/develop/src/PointCloudEptGeometry.js
// Original Author: connormanning

export default function parseEPTTileset(info, url) {
  // TODO - check what versions this code supports
  // assert(info.version === ...);

  const {scale, offset} = getScaleAndOffset(info);
  const {coordinateSystem, coordinateSystemFallback} = getCoordinateSystem(info);

  const tileset = {
    // Original EPT format data
    loaderData: info,

    // Standardized 3D tile category format data
    type: 'ept',
    version: 1, // Version of 3D tile category data (not EPT version)
    url,
    // bounds: info.bounds,

    coordinateSystem,
    coordinateSystemFallback,

    scale,
    offset

    // Additional fields
    // hierarchyFormat: info.hierarchyType || 'json',
    // tileFormat: info.dataType
  };

  /*
  let boundsConforming = info.boundsConforming;

  this.span = info.span || info.ticks;
  this.boundingBox = U.toBox3(bounds);
  this.tightBoundingBox = U.toBox3(boundsConforming);
  this.offset = U.toVector3([0, 0, 0]);
  this.boundingSphere = U.sphereFrom(this.boundingBox);
  this.tightBoundingSphere = U.sphereFrom(this.tightBoundingBox);


  this.pointAttributes = 'LAZ';
  this.spacing = (this.boundingBox.max.x - this.boundingBox.min.x) / this.span;

  let hierarchyType = info.hierarchyType || 'json';
  */

  switch (info.dataType) {
    case 'laszip':
      // this.loader = new Potree.EptLaszipLoader();
      break;
    case 'binary':
      // this.loader = new Potree.EptBinaryLoader();
      break;
    case 'zstandard':
      // this.loader = new Potree.EptZstandardLoader();
      break;
    default:
      throw new Error(`Could not read data type: ${info.dataType}`);
  }

  return tileset;
}

// Extracts scale and offset from schema
function getScaleAndOffset(info) {
  const xyz = [
    findSchemaEntry(info.schema, 'X'),
    findSchemaEntry(info.schema, 'Y'),
    findSchemaEntry(info.schema, 'Z')
  ];

  return {
    scale: xyz.map(d => d.scale || 1),
    offset: xyz.map(d => d.offset || 0)
  };
}

// Extracts a named field from the schema : [{X, ...}, {Y: ...}]
function findSchemaEntry(schema, name) {
  const schemaEntry = schema.find(entry => entry.name === name);
  if (!schemaEntry) {
    throw new Error(`Failed to find ${name} in EPT schema`);
  }
  return schemaEntry;
}

// Extracts coordinate system (and fallback) from info
function getCoordinateSystem(info) {
  let coordinateSystem = null;
  let coordinateSystemFallback = null;

  if (info.srs && info.srs.horizontal) {
    coordinateSystem = `${info.srs.authority}:${info.srs.horizontal}`;
  }

  if (info.srs.wkt) {
    if (!coordinateSystem) {
      coordinateSystem = info.srs.wkt;
    } else {
      coordinateSystemFallback = info.srs.wkt;
    }
  }
  return {coordinateSystem, coordinateSystemFallback};
}
