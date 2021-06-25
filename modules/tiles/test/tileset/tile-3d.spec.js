// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

// @ts-ignore
import test from 'tape-promise/tape';
import {Matrix4} from '@math.gl/core';
import {Tile3D} from '@loaders.gl/tiles';
// @ts-ignore
import {LOD_METRIC_TYPE} from '../../src';

// @ts-ignore
const clone = (object, flag) => JSON.parse(JSON.stringify(object));

const TILE_HEADER_WITH_BOUNDING_SPHERE = {
  lodMetricValue: 1,
  lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR,
  refine: 'REPLACE',
  children: [],
  boundingVolume: {
    sphere: [0.0, 0.0, 0.0, 5.0]
  }
};

/*
const TILE_HEADER_WITH_CONTENT_BOUNDING_SPHERE = {
  lodMetricValue: 1,
  refine: 'REPLACE',
  content: {
    url: '0/0.b3dm',
    boundingVolume: {
      sphere: [0.0, 0.0, 1.0, 5.0]
    }
  },
  children: [],
  boundingVolume: {
    sphere: [0.0, 0.0, 1.0, 5.0]
  }
};

const TILE_HEADER_WITH_BOUNDING_REGION = {
  lodMetricValue: 1,
  refine: 'REPLACE',
  children: [],
  boundingVolume: {
    region: [-1.2, -1.2, 0.0, 0.0, -30, -34]
  }
};

const TILE_HEADER_WITH_CONTENT_BOUNDING_REGION = {
  lodMetricValue: 1,
  refine: 'REPLACE',
  children: [],
  content: {
    url: '0/0.b3dm',
    boundingVolume: {
      region: [-1.2, -1.2, 0, 0, -30, -34]
    }
  },
  boundingVolume: {
    region: [-1.2, -1.2, 0, 0, -30, -34]
  }
};

const TILE_HEADER_WITH_BOUNDING_BOX = {
  lodMetricValue: 1,
  refine: 'REPLACE',
  children: [],
  boundingVolume: {
    box: [0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]
  }
};

const TILE_HEADER_WITH_CONTENT_BOUNDING_BOX = {
  lodMetricValue: 1,
  refine: 'REPLACE',
  children: [],
  content: {
    url: '0/0.b3dm',
    boundingVolume: {
      box: [0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 2.0]
    }
  },
  boundingVolume: {
    box: [0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 2.0]
  }
};

const TILE_HEADER_WITH_VIEWER_REQUEST_VOLUME = {
  lodMetricValue: 1,
  refine: 'REPLACE',
  children: [],
  boundingVolume: {
    box: [0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 2.0]
  },
  viewerRequestVolume: {
    box: [0.0, 0.0, 1.0, 2.0, 0.0, 0.0, 0.0, 2.0, 0.0, 0.0, 0.0, 2.0]
  }
};
*/

const MOCK_TILESET = {
  debugShowBoundingVolume: true,
  debugShowViewerRequestVolume: true,
  modelMatrix: new Matrix4(),
  lodMetricValue: 2,
  lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR
};

// const centerLongitude = -1.31968;
// const centerLatitude = 0.698874;

// function getTileTransform(longitude, latitude) {
//   const transformCenter = Cartesian3.fromRadians(longitude, latitude, 0.0);
//   const hpr = new HeadingPitchRoll();
//   const transformMatrix = Transforms.headingPitchRollToFixedFrame(transformCenter, hpr);
//   return Matrix4.pack(transformMatrix, new Array(16));
// }

test('Tile3D#destroys', (t) => {
  // @ts-ignore
  const tile = new Tile3D(MOCK_TILESET, TILE_HEADER_WITH_BOUNDING_SPHERE);
  t.equals(tile.isDestroyed(), false);
  tile.destroy();
  t.equals(tile.isDestroyed(), true);
  t.end();
});

test('Tile3D#throws if boundingVolume is undefined', (t) => {
  const tileWithoutBoundingVolume = clone(TILE_HEADER_WITH_BOUNDING_SPHERE, true);

  delete tileWithoutBoundingVolume.boundingVolume;
  // @ts-ignore
  t.throws(() => new Tile3D(MOCK_TILESET, tileWithoutBoundingVolume));
  t.end();
});

test('Tile3D#throws if boundingVolume does not contain a sphere, region, or box', (t) => {
  const tileWithoutBoundingVolume = clone(TILE_HEADER_WITH_BOUNDING_SPHERE, true);

  delete tileWithoutBoundingVolume.boundingVolume.sphere;
  // @ts-ignore
  t.throws(() => new Tile3D(MOCK_TILESET, tileWithoutBoundingVolume));
  t.end();
});

test('Tile3D#geometric error is undefined', (t) => {
  // spyOn(Tile3D, '_deprecationWarning');

  const lodMetricValueMissing = clone(TILE_HEADER_WITH_BOUNDING_SPHERE, true);
  delete lodMetricValueMissing.lodMetricValue;

  // @ts-ignore
  const parent = new Tile3D(MOCK_TILESET, TILE_HEADER_WITH_BOUNDING_SPHERE);
  // @ts-ignore
  const child = new Tile3D(MOCK_TILESET, lodMetricValueMissing, parent);
  t.equals(child.lodMetricType, parent.lodMetricType);
  t.equals(child.lodMetricValue, parent.lodMetricValue);
  t.equals(child.lodMetricValue, 1);

  // @ts-ignore
  const tile = new Tile3D(MOCK_TILESET, lodMetricValueMissing);
  t.equals(tile.lodMetricValue, MOCK_TILESET.lodMetricValue);
  t.equals(tile.lodMetricValue, 2);

  t.end();
});

test('Tile3D#viewerRequestVolume is camera inside the MBS viewer request volume', (t) => {
  const tileset = {
    ...MOCK_TILESET,
    type: 'TILES3D',
    _traverser: {options: {}},
    options: {viewDistanceScale: 1}
  };
  const tileHeaderWithViewerRequestVolume = {
    ...TILE_HEADER_WITH_BOUNDING_SPHERE,
    viewerRequestVolume: {
      sphere: [0, 0, 0, 1]
    },
    content: {}
  };

  // @ts-ignore
  const tile = new Tile3D(tileset, tileHeaderWithViewerRequestVolume);
  tile.updateVisibility(
    {
      frameNumber: 100,
      camera: {position: [0, 0, 0]},
      cullingVolume: {
        computeVisibilityWithPlaneMask: () => false
      }
    },
    ['test']
  );
  t.ok(tile.header.viewerRequestVolume);
  // @ts-ignore
  t.equal(tile._inRequestVolume, true);
  t.end();
});

test('Tile3D#viewerRequestVolume is camera outside the MBS viewer request volume', (t) => {
  const tileset = {
    ...MOCK_TILESET,
    type: 'TILES3D',
    _traverser: {options: {}},
    options: {viewDistanceScale: 1}
  };
  const tileHeaderWithViewerRequestVolume = {
    ...TILE_HEADER_WITH_BOUNDING_SPHERE,
    viewerRequestVolume: {
      sphere: [0, 0, 0, 1]
    },
    content: {}
  };

  // @ts-ignore
  const tile = new Tile3D(tileset, tileHeaderWithViewerRequestVolume);
  tile.updateVisibility(
    {
      frameNumber: 100,
      camera: {position: [1, 1, 0]},
      cullingVolume: {
        computeVisibilityWithPlaneMask: () => false
      }
    },
    ['test']
  );
  t.ok(tile.header.viewerRequestVolume);
  // @ts-ignore
  t.equal(tile._inRequestVolume, false);
  t.end();
});

test('Tile3D#viewerRequestVolume is camera inside the OBB viewer request volume', (t) => {
  const tileset = {
    ...MOCK_TILESET,
    type: 'TILES3D',
    _traverser: {options: {}},
    options: {viewDistanceScale: 1}
  };
  const tileHeaderWithViewerRequestVolume = {
    ...TILE_HEADER_WITH_BOUNDING_SPHERE,
    viewerRequestVolume: {
      box: [0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 2.0]
    },
    content: {}
  };

  // @ts-ignore
  const tile = new Tile3D(tileset, tileHeaderWithViewerRequestVolume);
  tile.updateVisibility(
    {
      frameNumber: 100,
      camera: {position: [1, 1, 0]},
      cullingVolume: {
        computeVisibilityWithPlaneMask: () => false
      }
    },
    ['test']
  );
  t.ok(tile.header.viewerRequestVolume);
  // @ts-ignore
  t.equal(tile._inRequestVolume, true);
  t.end();
});

test('Tile3D#viewerRequestVolume is camera outside the OBB viewer request volume', (t) => {
  const tileset = {
    ...MOCK_TILESET,
    type: 'TILES3D',
    _traverser: {options: {}},
    options: {viewDistanceScale: 1}
  };
  const tileHeaderWithViewerRequestVolume = {
    ...TILE_HEADER_WITH_BOUNDING_SPHERE,
    viewerRequestVolume: {
      box: [0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 2.0]
    },
    content: {}
  };

  // @ts-ignore
  const tile = new Tile3D(tileset, tileHeaderWithViewerRequestVolume);
  tile.updateVisibility(
    {
      frameNumber: 100,
      camera: {position: [2, 2, 0]},
      cullingVolume: {
        computeVisibilityWithPlaneMask: () => false
      }
    },
    ['test']
  );
  t.ok(tile.header.viewerRequestVolume);
  // @ts-ignore
  t.equal(tile._inRequestVolume, false);
  t.end();
});

/*
test('Tile3D#bounding volumes', tt => {
  test('Tile3D#returns the tile bounding volume if the content bounding volume is undefined', t => {
    const tile = new Tile3D(MOCK_TILESET, TILE_HEADER_WITH_BOUNDING_SPHERE, undefined);
    t.ok(tile.boundingVolume);
    t.deepEquals(tile.contentBoundingVolume, tile.boundingVolume);
    t.end();
  });

  test('Tile3D#can have a bounding sphere', t => {
    const tile = new Tile3D(MOCK_TILESET, TILE_HEADER_WITH_BOUNDING_SPHERE, undefined);
    const radius = TILE_HEADER_WITH_BOUNDING_SPHERE.boundingVolume.sphere[3];
    t.ok(tile.boundingVolume);
    t.equals(tile.boundingVolume.boundingVolume.radius, radius);
    t.deepEquals(tile.boundingVolume.boundingVolume.center, [0, 0, 0]);
    t.end();
  });

  test('Tile3D#can have a content bounding sphere', t => {
    const tile = new Tile3D(
      MOCK_TILESET,
      TILE_HEADER_WITH_CONTENT_BOUNDING_SPHERE,
      undefined
    );
    const radius = TILE_HEADER_WITH_CONTENT_BOUNDING_SPHERE.content.boundingVolume.sphere[3];
    t.ok(tile.contentBoundingVolume);
    t.equals(tile.contentBoundingVolume.boundingVolume.radius, radius);
    t.deepEquals(tile.contentBoundingVolume.boundingVolume.center, [0.0, 0.0, 1.0]);
    t.end();
  });

  test('Tile3D#can have a bounding region', t => {
    const box = TILE_HEADER_WITH_BOUNDING_REGION.boundingVolume.region;
    const rectangle = new Rectangle(box[0], box[1], box[2], box[3]);
    const minimumHeight = TILE_HEADER_WITH_BOUNDING_REGION.boundingVolume.region[4];
    const maximumHeight = TILE_HEADER_WITH_BOUNDING_REGION.boundingVolume.region[5];
    const tile = new Tile3D(MOCK_TILESET, TILE_HEADER_WITH_BOUNDING_REGION, undefined);
    const tbr = new TileBoundingRegion({rectangle, minimumHeight, maximumHeight});
    t.ok(tile.boundingVolume);
    t.equals(tile.boundingVolume, tbr);
    t.end();
  });

  test('Tile3D#can have a content bounding region', t => {
    const region = TILE_HEADER_WITH_CONTENT_BOUNDING_REGION.content.boundingVolume.region;
    const tile = new Tile3D(
      MOCK_TILESET,
      '/s_Cme_url',
      TILE_HEADER_WITH_CONTENT_BOUNDING_REGION,
      undefined
    );
    t.ok(tile.contentBoundingVolume);
    const tbb = new TileBoundingRegion({
      rectangle: new Rectangle(region[0], region[1], region[2], region[3]),
      minimumHeight: region[4],
      maximumHeight: region[5]
    });
    t.equals(tile.contentBoundingVolume, tbb);
    t.end();
  });

  test('Tile3D#can have an oriented bounding box', t => {
    const box = TILE_HEADER_WITH_BOUNDING_BOX.boundingVolume.box;
    const tile = new Tile3D(MOCK_TILESET, TILE_HEADER_WITH_BOUNDING_BOX, undefined);
    t.ok(tile.boundingVolume);
    const center = new Cartesian3(box[0], box[1], box[2]);
    const halfAxes = Matrix3.fromArray(box, 3);
    const obb = new TileOrientedBoundingBox(center, halfAxes);
    t.equals(tile.boundingVolume, obb);
    t.end();
  });

  test('Tile3D#can have a content oriented bounding box', t => {
    const box = TILE_HEADER_WITH_CONTENT_BOUNDING_BOX.boundingVolume.box;
    const tile = new Tile3D(MOCK_TILESET, TILE_HEADER_WITH_CONTENT_BOUNDING_BOX, undefined);
    t.ok(tile.contentBoundingVolume);
    const center = new Cartesian3(box[0], box[1], box[2]);
    const halfAxes = Matrix3.fromArray(box, 3);
    const obb = new TileOrientedBoundingBox(center, halfAxes);
    t.equals(tile.contentBoundingVolume, obb);
    t.end();
  });

  test('Tile3D#tile transform affects bounding sphere', t => {
    const header = clone(TILE_HEADER_WITH_CONTENT_BOUNDING_SPHERE, true);
    header.transform = getTileTransform(centerLongitude, centerLatitude);
    const tile = new Tile3D(MOCK_TILESET, header, undefined);
    const boundingSphere = tile.boundingVolume.boundingVolume;
    const contentBoundingSphere = tile.contentBoundingVolume.boundingVolume;

    const boundingVolumeCenter = Cartesian3.fromRadians(centerLongitude, centerLatitude, 1.0);
    expect(boundingSphere.center).toEqualEpsilon(boundingVolumeCenter, CesiumMath.EPSILON4);
    t.equals(boundingSphere.radius, 5.0); // No change

    expect(contentBoundingSphere.center).toEqualEpsilon(boundingVolumeCenter, CesiumMath.EPSILON4);
    t.equals(contentBoundingSphere.radius, 5.0); // No change
    t.end();
  });

  test('Tile3D#tile transform affects oriented bounding box', t => {
    const header = clone(TILE_HEADER_WITH_CONTENT_BOUNDING_BOX, true);
    header.transform = getTileTransform(centerLongitude, centerLatitude);
    const tile = new Tile3D(MOCK_TILESET, header, undefined);
    const boundingBox = tile.boundingVolume.boundingVolume;
    const contentBoundingBox = tile.contentBoundingVolume.boundingVolume;

    const boundingVolumeCenter = Cartesian3.fromRadians(centerLongitude, centerLatitude, 1.0);
    expect(boundingBox.center).toEqualEpsilon(boundingVolumeCenter, CesiumMath.EPSILON7);
    expect(contentBoundingBox.center).toEqualEpsilon(boundingVolumeCenter, CesiumMath.EPSILON7);
    t.end();
  });

  test('Tile3D#tile transform does not affect bounding region', t => {
    const header = clone(TILE_HEADER_WITH_CONTENT_BOUNDING_REGION, true);
    header.transform = getTileTransform(centerLongitude, centerLatitude);
    const tile = new Tile3D(MOCK_TILESET, header, undefined);
    const boundingRegion = tile.boundingVolume;
    const contentBoundingRegion = tile.contentBoundingVolume;

    const region = header.boundingVolume.region;
    const rectangle = Rectangle.unpack(region);
    t.equals(boundingRegion.rectangle, rectangle);
    t.equals(contentBoundingRegion.rectangle, rectangle);
    t.end();
  });

  test('Tile3D#tile transform affects viewer request volume', t => {
    const header = clone(TILE_HEADER_WITH_VIEWER_REQUEST_VOLUME, true);
    header.transform = getTileTransform(centerLongitude, centerLatitude);
    const tile = new Tile3D(MOCK_TILESET, header, undefined);
    const requestVolume = tile._viewerRequestVolume.boundingVolume;
    const requestVolumeCenter = Cartesian3.fromRadians(centerLongitude, centerLatitude, 1.0);
    expect(requestVolume.center).toEqualEpsilon(requestVolumeCenter, CesiumMath.EPSILON7);
    t.end();
  });

  test('Tile3D#tile transform changes', t => {
    const MOCK_TILESET = {
      modelMatrix: Matrix4.IDENTITY
    };
    const header = clone(TILE_HEADER_WITH_BOUNDING_SPHERE, true);
    header.transform = getTileTransform(centerLongitude, centerLatitude);
    const tile = new Tile3D(MOCK_TILESET, header, undefined);
    const boundingSphere = tile.boundingVolume.boundingVolume;

    // Check the original transform
    const boundingVolumeCenter = Cartesian3.fromRadians(centerLongitude, centerLatitude);
    expect(boundingSphere.center).toEqualEpsilon(boundingVolumeCenter, CesiumMath.EPSILON7);

    // Change the transform
    const newLongitude = -1.012;
    const newLatitude = 0.698874;
    tile.transform = getTileTransform(newLongitude, newLatitude);
    tile.updateTransform();

    // Check the new transform
    const newCenter = Cartesian3.fromRadians(newLongitude, newLatitude);
    expect(boundingSphere.center).toEqualEpsilon(newCenter, CesiumMath.EPSILON7);
    t.end();
  });

  tt.end();
});

test('Tile3D#debug bounding volumes', tt => {
  const scene;
  beforeEach(function() {
    scene = createScene();
    scene.frameState.passes.render = true;
    t.end();
  });

  afterEach(function() {
    scene.destroyForSpecs();
    t.end();
  });

  test('Tile3D#can be a bounding region', t => {
    const tile = new Tile3D(MOCK_TILESET, TILE_HEADER_WITH_BOUNDING_REGION, undefined);
    tile.update(MOCK_TILESET, scene.frameState);
    t.ok(tile._debugBoundingVolume);
    t.end();
  });

  test('Tile3D#can be an oriented bounding box', t => {
    const tile = new Tile3D(MOCK_TILESET, TILE_HEADER_WITH_BOUNDING_BOX, undefined);
    tile.update(MOCK_TILESET, scene.frameState);
    t.ok(tile._debugBoundingVolume);
    t.end();
  });

  test('Tile3D#can be a bounding sphere', t => {
    const tile = new Tile3D(MOCK_TILESET, TILE_HEADER_WITH_BOUNDING_SPHERE, undefined);
    tile.update(MOCK_TILESET, scene.frameState);
    t.ok(tile._debugBoundingVolume);
    t.end();
  });

  test('Tile3D#creates debug bounding volume for viewer request volume', t => {
    const tile = new Tile3D(MOCK_TILESET, TILE_HEADER_WITH_VIEWER_REQUEST_VOLUME, undefined);
    tile.update(MOCK_TILESET, scene.frameState);
    t.ok(tile._debugViewerRequestVolume);
    t.end();
  });

  tt.end();
});
*/
