import test from 'tape-promise/tape';
import {Matrix4} from 'math.gl';
import {TILE3D_REFINEMENT} from '@loaders.gl/3d-tiles/constants';
import Tile3D from '@loaders.gl/3d-tiles/tileset/tile-3d';

const clone = x => x;

const TILE_WITH_BOUNDING_SPHERE = {
  geometricError: 1,
  refine: 'REPLACE',
  children: [],
  boundingVolume: {
    sphere: [0.0, 0.0, 0.0, 5.0]
  }
};

const TILE_WITH_CONTENT_BOUNDING_SPHERE = {
  geometricError: 1,
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

const TILE_WITH_BOUNDING_REGION = {
  geometricError: 1,
  refine: 'REPLACE',
  children: [],
  boundingVolume: {
    region: [-1.2, -1.2, 0.0, 0.0, -30, -34]
  }
};

const TILE_WITH_CONTENT_BOUNDING_REGION = {
  geometricError: 1,
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

const TILE_WITH_BOUNDING_BOX = {
  geometricError: 1,
  refine: 'REPLACE',
  children: [],
  boundingVolume: {
    box: [0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]
  }
};

const TILE_WITH_CONTENT_BOUNDING_BOX = {
  geometricError: 1,
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

const TILE_WITH_VIEWER_REQUEST_VOLUME = {
  geometricError: 1,
  refine: 'REPLACE',
  children: [],
  boundingVolume: {
    box: [0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 2.0]
  },
  viewerRequestVolume: {
    box: [0.0, 0.0, 1.0, 2.0, 0.0, 0.0, 0.0, 2.0, 0.0, 0.0, 0.0, 2.0]
  }
};

const MOCK_TILESET = {
  debugShowBoundingVolume: true,
  debugShowViewerRequestVolume: true,
  modelMatrix: new Matrix4(),
  _geometricError: 2
};

const centerLongitude = -1.31968;
const centerLatitude = 0.698874;

function getTileTransform(longitude, latitude) {
  const transformCenter = Cartesian3.fromRadians(longitude, latitude, 0.0);
  const hpr = new HeadingPitchRoll();
  const transformMatrix = Transforms.headingPitchRollToFixedFrame(transformCenter, hpr);
  return Matrix4.pack(transformMatrix, new Array(16));
}

test('destroys', t => {
  const tile = new Tile3D(MOCK_TILESET, '/some_url', TILE_WITH_BOUNDING_SPHERE, undefined);
  t.equals(tile.isDestroyed(), false);
  tile.destroy();
  t.equals(tile.isDestroyed(), true);
  t.end();
});

test('throws if boundingVolume is undefined', t => {
  const tileWithoutBoundingVolume = clone(TILE_WITH_BOUNDING_SPHERE, true);
  delete tileWithoutBoundingVolume.boundingVolume;
  t.throws(() => new Tile3D(MOCK_TILESET, '/some_url', tileWithoutBoundingVolume, undefined));
  t.end();
});

test('throws if boundingVolume does not contain a sphere, region, or box', t => {
  const tileWithoutBoundingVolume = clone(TILE_WITH_BOUNDING_SPHERE, true);
  delete tileWithoutBoundingVolume.boundingVolume.sphere;
  t.throws(() => Tile3D(MOCK_TILESET, '/some_url', tileWithoutBoundingVolume, undefined));
  t.end();
});

test('logs deprecation warning if refine is lowercase', t => {
  // spyOn(Tile3D, '_deprecationWarning');
  const header = clone(TILE_WITH_BOUNDING_SPHERE, true);
  header.refine = 'replace';
  const tile = new Tile3D(MOCK_TILESET, '/some_url', header, undefined);
  t.equals(tile.refine, TILE3D_REFINEMENT.REPLACE);
  // expect(Tile3D._deprecationWarning).toHaveBeenCalled();
  t.end();
});

test('logs deprecation warning if geometric error is undefined', t => {
  // spyOn(Tile3D, '_deprecationWarning');

  const geometricErrorMissing = clone(TILE_WITH_BOUNDING_SPHERE, true);
  delete geometricErrorMissing.geometricError;

  const parent = new Tile3D(MOCK_TILESET, '/some_url', TILE_WITH_BOUNDING_SPHERE, undefined);
  const child = new Tile3D(MOCK_TILESET, '/some_url', geometricErrorMissing, parent);
  t.deepEquals(child.geometricError, parent.geometricError);
  t.deepEquals(child.geometricError, 1);

  const tile = new Tile3D(MOCK_TILESET, '/some_url', geometricErrorMissing, undefined);
  t.deepEquals(tile.geometricError, MOCK_TILESET._geometricError);
  t.deepEquals(tile.geometricError, 2);

  // expect(Tile3D._deprecationWarning.calls.count()).toBe(2);
  t.end();
});

test('bounding volumes', tt => {
  test('returns the tile bounding volume if the content bounding volume is undefined', t => {
    const tile = new Tile3D(MOCK_TILESET, '/some_url', TILE_WITH_BOUNDING_SPHERE, undefined);
    t.ok(tile.boundingVolume);
    t.deepEquals(tile.contentBoundingVolume, tile.boundingVolume);
    t.end();
  });

  test('can have a bounding sphere', t => {
    const tile = new Tile3D(MOCK_TILESET, '/some_url', TILE_WITH_BOUNDING_SPHERE, undefined);
    const radius = TILE_WITH_BOUNDING_SPHERE.boundingVolume.sphere[3];
    t.ok(tile.boundingVolume);
    t.equals(tile.boundingVolume.boundingVolume.radius, radius);
    t.deepEquals(tile.boundingVolume.boundingVolume.center, [0, 0, 0]);
    t.end();
  });

  test('can have a content bounding sphere', t => {
    const tile = new Tile3D(
      MOCK_TILESET,
      '/some_url',
      TILE_WITH_CONTENT_BOUNDING_SPHERE,
      undefined
    );
    const radius = TILE_WITH_CONTENT_BOUNDING_SPHERE.content.boundingVolume.sphere[3];
    t.ok(tile.contentBoundingVolume);
    t.equals(tile.contentBoundingVolume.boundingVolume.radius, radius);
    t.deepEquals(tile.contentBoundingVolume.boundingVolume.center, [0.0, 0.0, 1.0]);
    t.end();
  });

  test('can have a bounding region', t => {
    const box = TILE_WITH_BOUNDING_REGION.boundingVolume.region;
    const rectangle = new Rectangle(box[0], box[1], box[2], box[3]);
    const minimumHeight = TILE_WITH_BOUNDING_REGION.boundingVolume.region[4];
    const maximumHeight = TILE_WITH_BOUNDING_REGION.boundingVolume.region[5];
    const tile = new Tile3D(MOCK_TILESET, '/some_url', TILE_WITH_BOUNDING_REGION, undefined);
    const tbr = new TileBoundingRegion({rectangle, minimumHeight, maximumHeight});
    t.ok(tile.boundingVolume);
    t.equals(tile.boundingVolume, tbr);
    t.end();
  });

  test('can have a content bounding region', t => {
    const region = TILE_WITH_CONTENT_BOUNDING_REGION.content.boundingVolume.region;
    const tile = new Tile3D(
      MOCK_TILESET,
      '/s_Cme_url',
      TILE_WITH_CONTENT_BOUNDING_REGION,
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

  test('can have an oriented bounding box', t => {
    const box = TILE_WITH_BOUNDING_BOX.boundingVolume.box;
    const tile = new Tile3D(MOCK_TILESET, '/some_url', TILE_WITH_BOUNDING_BOX, undefined);
    t.ok(tile.boundingVolume);
    const center = new Cartesian3(box[0], box[1], box[2]);
    const halfAxes = Matrix3.fromArray(box, 3);
    const obb = new TileOrientedBoundingBox(center, halfAxes);
    t.equals(tile.boundingVolume, obb);
    t.end();
  });

  test('can have a content oriented bounding box', t => {
    const box = TILE_WITH_CONTENT_BOUNDING_BOX.boundingVolume.box;
    const tile = new Tile3D(MOCK_TILESET, '/some_url', TILE_WITH_CONTENT_BOUNDING_BOX, undefined);
    t.ok(tile.contentBoundingVolume);
    const center = new Cartesian3(box[0], box[1], box[2]);
    const halfAxes = Matrix3.fromArray(box, 3);
    const obb = new TileOrientedBoundingBox(center, halfAxes);
    t.equals(tile.contentBoundingVolume, obb);
    t.end();
  });

  test('tile transform affects bounding sphere', t => {
    const header = clone(TILE_WITH_CONTENT_BOUNDING_SPHERE, true);
    header.transform = getTileTransform(centerLongitude, centerLatitude);
    const tile = new Tile3D(MOCK_TILESET, '/some_url', header, undefined);
    const boundingSphere = tile.boundingVolume.boundingVolume;
    const contentBoundingSphere = tile.contentBoundingVolume.boundingVolume;

    const boundingVolumeCenter = Cartesian3.fromRadians(centerLongitude, centerLatitude, 1.0);
    expect(boundingSphere.center).toEqualEpsilon(boundingVolumeCenter, CesiumMath.EPSILON4);
    t.equals(boundingSphere.radius, 5.0); // No change

    expect(contentBoundingSphere.center).toEqualEpsilon(boundingVolumeCenter, CesiumMath.EPSILON4);
    t.equals(contentBoundingSphere.radius, 5.0); // No change
    t.end();
  });

  test('tile transform affects oriented bounding box', t => {
    const header = clone(TILE_WITH_CONTENT_BOUNDING_BOX, true);
    header.transform = getTileTransform(centerLongitude, centerLatitude);
    const tile = new Tile3D(MOCK_TILESET, '/some_url', header, undefined);
    const boundingBox = tile.boundingVolume.boundingVolume;
    const contentBoundingBox = tile.contentBoundingVolume.boundingVolume;

    const boundingVolumeCenter = Cartesian3.fromRadians(centerLongitude, centerLatitude, 1.0);
    expect(boundingBox.center).toEqualEpsilon(boundingVolumeCenter, CesiumMath.EPSILON7);
    expect(contentBoundingBox.center).toEqualEpsilon(boundingVolumeCenter, CesiumMath.EPSILON7);
    t.end();
  });

  test('tile transform does not affect bounding region', t => {
    const header = clone(TILE_WITH_CONTENT_BOUNDING_REGION, true);
    header.transform = getTileTransform(centerLongitude, centerLatitude);
    const tile = new Tile3D(MOCK_TILESET, '/some_url', header, undefined);
    const boundingRegion = tile.boundingVolume;
    const contentBoundingRegion = tile.contentBoundingVolume;

    const region = header.boundingVolume.region;
    const rectangle = Rectangle.unpack(region);
    t.equals(boundingRegion.rectangle, rectangle);
    t.equals(contentBoundingRegion.rectangle, rectangle);
    t.end();
  });

  test('tile transform affects viewer request volume', t => {
    const header = clone(TILE_WITH_VIEWER_REQUEST_VOLUME, true);
    header.transform = getTileTransform(centerLongitude, centerLatitude);
    const tile = new Tile3D(MOCK_TILESET, '/some_url', header, undefined);
    const requestVolume = tile._viewerRequestVolume.boundingVolume;
    const requestVolumeCenter = Cartesian3.fromRadians(centerLongitude, centerLatitude, 1.0);
    expect(requestVolume.center).toEqualEpsilon(requestVolumeCenter, CesiumMath.EPSILON7);
    t.end();
  });

  test('tile transform changes', t => {
    const MOCK_TILESET = {
      modelMatrix: Matrix4.IDENTITY
    };
    const header = clone(TILE_WITH_BOUNDING_SPHERE, true);
    header.transform = getTileTransform(centerLongitude, centerLatitude);
    const tile = new Tile3D(MOCK_TILESET, '/some_url', header, undefined);
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

/*
test('debug bounding volumes', tt => {
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

  test('can be a bounding region', t => {
    const tile = new Tile3D(MOCK_TILESET, '/some_url', TILE_WITH_BOUNDING_REGION, undefined);
    tile.update(MOCK_TILESET, scene.frameState);
    t.ok(tile._debugBoundingVolume);
    t.end();
  });

  test('can be an oriented bounding box', t => {
    const tile = new Tile3D(MOCK_TILESET, '/some_url', TILE_WITH_BOUNDING_BOX, undefined);
    tile.update(MOCK_TILESET, scene.frameState);
    t.ok(tile._debugBoundingVolume);
    t.end();
  });

  test('can be a bounding sphere', t => {
    const tile = new Tile3D(MOCK_TILESET, '/some_url', TILE_WITH_BOUNDING_SPHERE, undefined);
    tile.update(MOCK_TILESET, scene.frameState);
    t.ok(tile._debugBoundingVolume);
    t.end();
  });

  test('creates debug bounding volume for viewer request volume', t => {
    const tile = new Tile3D(MOCK_TILESET, '/some_url', TILE_WITH_VIEWER_REQUEST_VOLUME, undefined);
    tile.update(MOCK_TILESET, scene.frameState);
    t.ok(tile._debugViewerRequestVolume);
    t.end();
  });

  tt.end();
});
*/
