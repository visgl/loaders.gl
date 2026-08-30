// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {expect, test, vi} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {TILE_CONTENT_STATE, Tile3D} from '@loaders.gl/tiles';
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
*/
const TILE_HEADER_WITH_BOUNDING_REGION = {
  lodMetricValue: 1,
  refine: 'REPLACE',
  children: [],
  boundingVolume: {
    region: [-1.2, -1.2, 0.0, 0.0, -34, -30]
  }
};
/*
const TILE_HEADER_WITH_CONTENT_BOUNDING_REGION = {
  lodMetricValue: 1,
  refine: 'REPLACE',
  children: [],
  content: {
    url: '0/0.b3dm',
    boundingVolume: {
      region: [-1.2, -1.2, 0, 0, -34, -30]
    }
  },
  boundingVolume: {
    region: [-1.2, -1.2, 0, 0, -34, -30]
  }
};
*/
const TILE_HEADER_WITH_BOUNDING_BOX = {
  lodMetricValue: 1,
  refine: 'REPLACE',
  children: [],
  boundingVolume: {
    box: [0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]
  }
};
/*
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
test('Tile3D#destroys', () => {
  // @ts-ignore
  const tile = new Tile3D(MOCK_TILESET, TILE_HEADER_WITH_BOUNDING_SPHERE);
  expect(tile.isDestroyed()).toBe(false);
  tile.destroy();
  expect(tile.isDestroyed()).toBe(true);
});
test('Tile3D#preserves viewer request volume when an implicit root materializes without content', () => {
  const tile = new Tile3D(MOCK_TILESET as any, {
    ...TILE_HEADER_WITH_BOUNDING_SPHERE,
    content: {uri: 'content/{level}.b3dm'},
    viewerRequestVolume: {sphere: [0, 0, 0, 2]}
  });
  tile.applyImplicitSubtreeHeader({
    ...TILE_HEADER_WITH_BOUNDING_SPHERE,
    contentUrl: undefined,
    content: undefined,
    type: 'empty'
  });
  expect(
    tile._viewerRequestVolume,
    'retains the inherited traversal request-volume restriction'
  ).toBeTruthy();
});
test('Tile3D#throws if boundingVolume is undefined', () => {
  const tileWithoutBoundingVolume = clone(TILE_HEADER_WITH_BOUNDING_SPHERE, true);
  delete tileWithoutBoundingVolume.boundingVolume;
  // @ts-ignore
  expect(() => new Tile3D(MOCK_TILESET, tileWithoutBoundingVolume)).toThrow();
});
test('Tile3D#throws if boundingVolume does not contain a sphere, region, or box', () => {
  const tileWithoutBoundingVolume = clone(TILE_HEADER_WITH_BOUNDING_SPHERE, true);
  delete tileWithoutBoundingVolume.boundingVolume.sphere;
  // @ts-ignore
  expect(() => new Tile3D(MOCK_TILESET, tileWithoutBoundingVolume)).toThrow();
});
test('Tile3D#geometric error is undefined', () => {
  // spyOn(Tile3D, '_deprecationWarning');
  const lodMetricValueMissing = clone(TILE_HEADER_WITH_BOUNDING_SPHERE, true);
  delete lodMetricValueMissing.lodMetricValue;
  // @ts-ignore
  const parent = new Tile3D(MOCK_TILESET, TILE_HEADER_WITH_BOUNDING_SPHERE);
  // @ts-ignore
  const child = new Tile3D(MOCK_TILESET, lodMetricValueMissing, parent);
  expect(child.lodMetricType).toBe(parent.lodMetricType);
  expect(child.lodMetricValue).toBe(parent.lodMetricValue);
  expect(child.lodMetricValue).toBe(1);
  // @ts-ignore
  const tile = new Tile3D(MOCK_TILESET, lodMetricValueMissing);
  expect(tile.lodMetricValue).toBe(MOCK_TILESET.lodMetricValue);
  expect(tile.lodMetricValue).toBe(2);
});
test('Tile3D#scales geometric error with the complete transform', () => {
  const uniformScaleHeader = {
    ...TILE_HEADER_WITH_BOUNDING_SPHERE,
    transform: new Matrix4().scale([3, 3, 3])
  };
  const nonUniformScaleHeader = {
    ...TILE_HEADER_WITH_BOUNDING_SPHERE,
    transform: new Matrix4().scale([2, 3, 4])
  };
  const rigidTransformHeader = {
    ...TILE_HEADER_WITH_BOUNDING_SPHERE,
    // A 90-degree Z rotation plus translation. Neither operation changes geometric error.
    transform: new Matrix4([0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 100, 200, 300, 1])
  };
  // @ts-ignore test uses the minimal tileset shape required by Tile3D
  expect(new Tile3D(MOCK_TILESET, uniformScaleHeader).lodMetricValue, 'uses uniform scale').toBe(3);
  // @ts-ignore test uses the minimal tileset shape required by Tile3D
  expect(
    new Tile3D(MOCK_TILESET, nonUniformScaleHeader).lodMetricValue,
    'uses the largest non-uniform scale component'
  ).toBe(4);
  // @ts-ignore test uses the minimal tileset shape required by Tile3D
  expect(
    new Tile3D(MOCK_TILESET, rigidTransformHeader).lodMetricValue,
    'ignores rotation and translation'
  ).toBe(1);
});
test('Tile3D#recomputes geometric error without compounding transform scale', () => {
  // @ts-ignore test uses the minimal tileset shape required by Tile3D
  const tile = new Tile3D(MOCK_TILESET, TILE_HEADER_WITH_BOUNDING_SPHERE);
  tile._updateTransform(new Matrix4().scale([2, 2, 2]));
  expect(tile.lodMetricValue, 'applies the first transform scale').toBe(2);
  tile._updateTransform(new Matrix4().scale([4, 4, 4]));
  expect(tile.lodMetricValue, 'recomputes from the source error after a scale change').toBe(4);
  tile._updateTransform(new Matrix4());
  expect(tile.lodMetricValue, 'returns to the source error when the scale is removed').toBe(1);
});
test('Tile3D#inherits unscaled geometric error before applying the child transform', () => {
  const parentHeader = {
    ...TILE_HEADER_WITH_BOUNDING_SPHERE,
    lodMetricValue: 2,
    transform: new Matrix4().scale([3, 3, 3])
  };
  const childHeader: {
    [key: string]: any;
  } = {
    ...TILE_HEADER_WITH_BOUNDING_SPHERE,
    transform: new Matrix4().scale([4, 4, 4])
  };
  delete childHeader.lodMetricValue;
  // @ts-ignore test uses the minimal tileset shape required by Tile3D
  const parent = new Tile3D(MOCK_TILESET, parentHeader);
  // @ts-ignore test uses the minimal tileset shape required by Tile3D
  const child = new Tile3D(MOCK_TILESET, childHeader, parent);
  expect(parent.lodMetricValue, 'parent geometric error uses its complete scale').toBe(6);
  expect(
    child.lodMetricValue,
    'child applies its complete scale to the inherited source error exactly once'
  ).toBe(24);
});
test('Tile3D#does not transform-scale I3S screen-threshold metrics', () => {
  const tileHeader = {
    ...TILE_HEADER_WITH_BOUNDING_SPHERE,
    lodMetricType: LOD_METRIC_TYPE.MAX_SCREEN_THRESHOLD,
    lodMetricValue: 5,
    transform: new Matrix4().scale([2, 3, 4])
  };
  // @ts-ignore test uses the minimal tileset shape required by Tile3D
  const tile = new Tile3D(MOCK_TILESET, tileHeader);
  expect(tile.lodMetricValue, 'keeps I3S metric in its original screen-space units').toBe(5);
});
test('Tile3D#viewerRequestVolume is camera inside the MBS viewer request volume', () => {
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
  expect(tile.header.viewerRequestVolume).toBeTruthy();
  // @ts-ignore
  expect(tile._inRequestVolume).toBe(true);
});
test('Tile3D#viewerRequestVolume is camera outside the MBS viewer request volume', () => {
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
  expect(tile.header.viewerRequestVolume).toBeTruthy();
  // @ts-ignore
  expect(tile._inRequestVolume).toBe(false);
});
test('Tile3D#viewerRequestVolume is camera inside the OBB viewer request volume', () => {
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
  expect(tile.header.viewerRequestVolume).toBeTruthy();
  // @ts-ignore
  expect(tile._inRequestVolume).toBe(true);
});
test('Tile3D#viewerRequestVolume is camera outside the OBB viewer request volume', () => {
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
  expect(tile.header.viewerRequestVolume).toBeTruthy();
  // @ts-ignore
  expect(tile._inRequestVolume).toBe(false);
});
test('Tile3D#tileDrawn defaults to true', () => {
  // @ts-ignore
  const tile = new Tile3D(MOCK_TILESET, TILE_HEADER_WITH_BOUNDING_SPHERE);
  expect(tile.tileDrawn, 'tileDrawn defaults to true for backwards compatibility').toBe(true);
  tile.tileDrawn = false;
  expect(tile.tileDrawn, 'tileDrawn can be set to false').toBe(false);
  tile.unloadContent();
  expect(tile.tileDrawn, 'tileDrawn resets to true after unloadContent').toBe(true);
});
// TODO failing test
test('Tile3D#screenSpaceError is calculated correctly', () => {
  const tileset = {
    ...MOCK_TILESET,
    type: 'TILES3D',
    _traverser: {options: {}},
    options: {viewDistanceScale: 1}
  };
  const tileHeaderWithViewerRequestVolume = {
    ...TILE_HEADER_WITH_BOUNDING_SPHERE,
    viewerRequestVolume: {
      sphere: [2, 2, -2, 1]
    },
    content: {}
  };
  // @ts-ignore
  const tile = new Tile3D(tileset, tileHeaderWithViewerRequestVolume);
  tile.updateVisibility(
    {
      frameNumber: 100,
      camera: {position: [10, 10, -10]},
      cullingVolume: {
        computeVisibilityWithPlaneMask: () => false
      },
      height: 500,
      sseDenominator: 11
    },
    ['test']
  );
  expect(tile.screenSpaceError).toBe(3.6893401777997967);
});
test('Tile3D#cartographic bounding box', () => {
  // @ts-ignore
  let tile = new Tile3D(MOCK_TILESET, TILE_HEADER_WITH_BOUNDING_BOX);
  expect(tile.boundingBox, 'Calculated for bounding box').toBeTruthy();
  // @ts-ignore
  tile = new Tile3D(MOCK_TILESET, TILE_HEADER_WITH_BOUNDING_SPHERE);
  expect(tile.boundingBox, 'Calculated for bounding sphere').toBeTruthy();
  // @ts-ignore
  tile = new Tile3D(MOCK_TILESET, {
    ...TILE_HEADER_WITH_BOUNDING_SPHERE,
    boundingVolume: {sphere: [1, 1, 1, 5]}
  });
  expect(tile.boundingBox, 'Calculated for bounding sphere').toBeTruthy();
  // @ts-ignore
  tile = new Tile3D(MOCK_TILESET, {
    ...TILE_HEADER_WITH_BOUNDING_SPHERE,
    boundingVolume: {sphere: [1, 0, 0, 5]}
  });
  expect(tile.boundingBox, 'Calculated for bounding sphere').toBeTruthy();
  // @ts-ignore
  tile = new Tile3D(MOCK_TILESET, TILE_HEADER_WITH_BOUNDING_REGION);
  expect(tile.boundingBox, 'Calculated for bounding region').toBeTruthy();
});

function createContentTileset(overrides: Record<string, any> = {}) {
  return {
    ...MOCK_TILESET,
    type: 'TILES3D',
    _frameNumber: 0,
    _traverser: {options: {skipLevelOfDetail: false}, root: null},
    options: {viewDistanceScale: 1},
    _requestScheduler: {
      scheduleRequest: vi.fn(async () => ({done: vi.fn()}))
    },
    source: {
      loadTileContent: vi.fn(async () => ({loaded: true, contents: []}))
    },
    ...overrides
  };
}

function createContentTile(tileset: Record<string, any>, header: Record<string, any> = {}) {
  return new Tile3D(tileset as any, {
    ...TILE_HEADER_WITH_BOUNDING_SPHERE,
    id: 'content-tile',
    contentUrl: 'content.b3dm',
    ...header
  });
}

test('Tile3D#loadContent covers cancellation, loaded content, and failures', async () => {
  const canceledTileset = createContentTileset({
    _requestScheduler: {scheduleRequest: vi.fn(async () => null)}
  });
  const canceledTile = createContentTile(canceledTileset);
  await expect(canceledTile.loadContent()).resolves.toEqual({loaded: false});
  expect(canceledTile.contentState).toBe(TILE_CONTENT_STATE.UNLOADED);

  const contentLoader = vi.fn();
  const vectorContent = {type: 'vctr', gpuMemoryUsageInBytes: 64, destroy: vi.fn()};
  const externalContent = {shape: 'tileset3d', byteLength: 32, destroy: vi.fn()};
  const successTileset = createContentTileset({
    options: {viewDistanceScale: 1, contentLoader},
    source: {
      loadTileContent: vi.fn(async () => ({
        loaded: true,
        contents: [vectorContent, externalContent]
      }))
    }
  });
  const successTile = createContentTile(successTileset);
  await expect(successTile.loadContent()).resolves.toMatchObject({loaded: true});
  expect(successTile.content).toBe(vectorContent);
  expect(successTile.contentState).toBe(TILE_CONTENT_STATE.READY);
  expect(successTile.hasTilesetContent).toBe(true);
  expect(successTileset._traverser.disableSkipLevelOfDetail).toBe(true);
  expect(contentLoader).toHaveBeenCalledWith(successTile);
  await expect(successTile.loadContent()).resolves.toEqual({loaded: true});
  successTile.unloadContent();
  expect(vectorContent.destroy).toHaveBeenCalled();
  expect(externalContent.destroy).toHaveBeenCalled();

  const failureTileset = createContentTileset({
    source: {loadTileContent: vi.fn(async () => Promise.reject(new Error('content failed')))}
  });
  const failedTile = createContentTile(failureTileset);
  await expect(failedTile.loadContent()).rejects.toThrow('content failed');
  expect(failedTile.contentFailed).toBe(true);
});

test('Tile3D#loadChildren shares requests and tracks cancellation and failure', async () => {
  const frameState = {frameNumber: 1} as any;
  let resolveChildren!: (value: any) => void;
  const childrenPromise = new Promise(resolve => {
    resolveChildren = resolve;
  });
  const tileset = createContentTileset({
    source: {loadTileChildren: vi.fn(() => childrenPromise)}
  });
  const tile = createContentTile(tileset, {implicitSubtree: {uri: '0.subtree'}});
  const firstLoad = tile.loadChildren(frameState);
  const repeatedLoad = tile.loadChildren(frameState);
  expect(tile.childrenLoading).toBe(true);
  resolveChildren({loaded: true, tileCount: 4, childSubtreeCount: 1});
  await expect(firstLoad).resolves.toMatchObject({loaded: true, tileCount: 4});
  await expect(repeatedLoad).resolves.toMatchObject({loaded: true, tileCount: 4});
  expect(tile.childrenState).toBe('ready');
  await expect(tile.loadChildren(frameState)).resolves.toMatchObject({loaded: false});

  const canceledTile = createContentTile(
    createContentTileset({
      _requestScheduler: {scheduleRequest: vi.fn(async () => null)},
      source: {loadTileChildren: vi.fn()}
    }),
    {implicitSubtree: {uri: '1.subtree'}}
  );
  await expect(canceledTile.loadChildren(frameState)).resolves.toMatchObject({loaded: false});
  expect(canceledTile.childrenState).toBe('unloaded');

  const unsupportedTile = createContentTile(createContentTileset(), {
    implicitSubtree: {uri: '2.subtree'}
  });
  await expect(unsupportedTile.loadChildren(frameState)).rejects.toThrow(
    'does not support lazy tile children'
  );

  const failedTile = createContentTile(
    createContentTileset({
      source: {loadTileChildren: vi.fn(async () => Promise.reject(new Error('subtree failed')))}
    }),
    {implicitSubtree: {uri: '3.subtree'}}
  );
  await expect(failedTile.loadChildren(frameState)).rejects.toThrow('subtree failed');
  expect(failedTile.childrenState).toBe('failed');
  expect(failedTile.hasUnloadedChildren).toBe(true);
});

test('Tile3D exposes memory, camera depth, selection, and expiration boundaries', () => {
  const tile = createContentTile(createContentTileset());
  tile.contents = [{gpuMemoryUsageInBytes: 10}, {byteLength: 20}, {}];
  expect(tile._getGpuMemoryUsageInBytes()).toBe(30);
  tile._selectedFrame = 4;
  tile.tileset._frameNumber = 4;
  expect(tile.selected).toBe(true);
  tile.unselect();
  expect(tile.selected).toBe(false);
  expect(
    tile.cameraSpaceZDepth({
      camera: {position: [0, 0, -10], direction: {dot: (vector: any) => vector[2]}}
    })
  ).toBe(10);

  tile.content = {id: 'expired'};
  tile.contents = [];
  tile.contentState = TILE_CONTENT_STATE.READY;
  tile._expireDate = 1;
  const previousLessThan = (Date as any).lessThan;
  (Date as any).lessThan = (left: number, right: number) => left < right;
  try {
    tile.updateExpiration();
  } finally {
    (Date as any).lessThan = previousLessThan;
  }
  expect(tile.contentExpired).toBe(true);
  expect(tile.contentAvailable).toBe(true);
});
