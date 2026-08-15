import test from 'test/utils/vitest-tape';
import type {DataSourceOptions} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {PointCloudTileset} from '@loaders.gl/tiles';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

type TileHeader = {
  id: string;
  level: number;
  pointCount: number;
  geometricError: number;
  boundingVolume: {
    cartographicBounds: [number[], number[]];
    center: number[];
    radius: number;
  };
};

type TileHeaderOptions = {
  id: string;
  level: number;
  pointCount: number;
  geometricError: number;
  bounds: [number[], number[]];
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(resolveValue => {
    resolve = resolveValue;
  });

  return {promise, resolve};
}

class TestPointCloudSource extends DataSource<string, DataSourceOptions> {
  isReady = false;
  getChildrenCallIds: string[] = [];

  private readonly rootTile: TileHeader = createTileHeader({
    id: 'root',
    level: 0,
    pointCount: 100,
    geometricError: 64,
    bounds: [
      [0, 0, 0],
      [100, 100, 10]
    ]
  });
  private readonly childTiles: Record<string, TileHeader[]> = {
    root: [
      createTileHeader({
        id: 'left',
        level: 1,
        pointCount: 50,
        geometricError: 8,
        bounds: [
          [0, 0, 0],
          [50, 100, 10]
        ]
      }),
      createTileHeader({
        id: 'right',
        level: 1,
        pointCount: 50,
        geometricError: 8,
        bounds: [
          [50, 0, 0],
          [100, 100, 10]
        ]
      })
    ]
  };
  private readonly deferredContent = {
    left: createDeferred<any>(),
    right: createDeferred<any>()
  };

  constructor() {
    super('test://pointcloud', {});
  }

  async initialize(): Promise<void> {
    this.isReady = true;
  }

  async getRootTile(): Promise<TileHeader> {
    return this.rootTile;
  }

  async getChildren(tile: TileHeader): Promise<TileHeader[]> {
    this.getChildrenCallIds.push(tile.id);
    return this.childTiles[tile.id] || [];
  }

  async loadTileContent(tile: TileHeader) {
    if (tile.id === 'root') {
      return null;
    }

    return await this.deferredContent[tile.id].promise;
  }

  getViewState() {
    return {
      boundingVolume: this.rootTile.boundingVolume,
      cartographicCenter: this.rootTile.boundingVolume.center
    };
  }

  resolveTile(tileId: 'left' | 'right') {
    this.deferredContent[tileId].resolve({
      data: {shape: 'arrow-table'} as MeshArrowTable,
      pointCount: 2,
      cartographicOrigin: [0, 0, 0],
      coordinateSystem: 'lnglat-offsets'
    });
  }
}

function createTileHeader({
  id,
  level,
  pointCount,
  geometricError,
  bounds: [minBounds, maxBounds]
}: TileHeaderOptions): TileHeader {
  const center = [
    (minBounds[0] + maxBounds[0]) / 2,
    (minBounds[1] + maxBounds[1]) / 2,
    (minBounds[2] + maxBounds[2]) / 2
  ];

  return {
    id,
    level,
    pointCount,
    geometricError,
    boundingVolume: {
      cartographicBounds: [minBounds, maxBounds],
      center,
      radius: 50
    }
  };
}

function createViewport(scale = 4) {
  return {
    id: 'main',
    width: 400,
    height: 400,
    project: ([longitude, latitude]) => [longitude * scale, latitude * scale]
  } as any;
}

function createFrustumViewport(scale = 4) {
  return {
    ...createViewport(scale),
    projectPosition: ([longitude, latitude, height = 0]) => [longitude, latitude, height],
    getFrustumPlanes: () => ({
      left: {normal: [1, 0, 0], distance: 0},
      right: {normal: [-1, 0, 0], distance: -10},
      bottom: {normal: [0, 1, 0], distance: 0},
      top: {normal: [0, -1, 0], distance: -200},
      near: {normal: [0, 0, 1], distance: 0},
      far: {normal: [0, 0, -1], distance: -200}
    })
  } as any;
}

test('PointCloudTileset#selectTiles refines visible tiles by projected node size', async t => {
  const source = new TestPointCloudSource();
  let tileLoadCount = 0;
  const tileset = new PointCloudTileset(source as any, {
    onTileLoad: () => {
      tileLoadCount++;
    }
  });

  const frameNumber = await tileset.selectTiles(createViewport());

  t.equal(frameNumber, 1, 'frame number increments after traversal');
  t.equal(tileset.frameNumber, 1, 'tileset frame number is updated');
  t.equal(tileset.tiles.length, 3, 'all discovered tiles are tracked');
  t.deepEqual(
    tileset.selectedTiles.map(tile => tile.id).sort(),
    ['left', 'right', 'root'],
    'point-cloud traversal keeps parent and child tiles selected when the root is large enough'
  );
  t.equal(tileset.isLoaded(), false, 'selected tiles are not loaded before content resolves');

  source.resolveTile('left');
  source.resolveTile('right');
  await new Promise(resolve => setTimeout(resolve, 0));

  t.equal(tileLoadCount, 2, 'tile load callback fires for loaded child tiles');
  t.equal(tileset.isLoaded(), true, 'tileset reports loaded after selected content resolves');
  t.end();
});

test('PointCloudTileset#selectTiles culls tiles outside the viewport frustum', async t => {
  const source = new TestPointCloudSource();
  const tileset = new PointCloudTileset(source as any);

  await tileset.selectTiles(createFrustumViewport());

  t.deepEqual(
    tileset.selectedTiles.map(tile => tile.id).sort(),
    ['left', 'root'],
    'right child is culled by the frustum even though its projected footprint overlaps the viewport'
  );
  t.equal(tileset.visibleTilesCount, 2, 'only frustum-intersecting tiles are counted as visible');
  t.end();
});

test('PointCloudTileset#selectTiles keeps coarse tiles when zoomed out', async t => {
  const source = new TestPointCloudSource();
  const tileset = new PointCloudTileset(source as any);

  await tileset.selectTiles(createViewport(0.4));

  t.equal(tileset.visibleTilesCount, 1, 'only the root is visible at low projected size');
  t.deepEqual(
    tileset.selectedTiles.map(tile => tile.id),
    ['root'],
    'only the root tile is selected when its projected radius is below the minimum'
  );
  t.deepEqual(source.getChildrenCallIds, [], 'children are not requested below minimum node size');
  t.equal(tileset.tiles.length, 1, 'children are not discovered below minimum node size');
  t.end();
});

test('PointCloudTileset#selectTiles respects point budget', async t => {
  const source = new TestPointCloudSource();
  const tileset = new PointCloudTileset(source as any, {
    pointBudget: 120
  });

  await tileset.selectTiles(createViewport());

  t.deepEqual(
    tileset.selectedTiles.map(tile => tile.id),
    ['root'],
    'child selection stops before exceeding the point budget'
  );
  t.deepEqual(source.getChildrenCallIds, ['root'], 'children are inspected after root refinement');
  t.end();
});

test('PointCloudTileset#selectTiles respects maxDepth', async t => {
  const source = new TestPointCloudSource();
  const tileset = new PointCloudTileset(source as any, {
    maxDepth: 0
  });

  await tileset.selectTiles(createViewport());

  t.deepEqual(
    tileset.selectedTiles.map(tile => tile.id),
    ['root'],
    'child selection stops at maxDepth'
  );
  t.deepEqual(source.getChildrenCallIds, [], 'children are not requested at maxDepth');
  t.end();
});

test('PointCloudTileset#debounces repeated traversal requests', async t => {
  const source = new TestPointCloudSource();
  const tileset = new PointCloudTileset(source as any, {
    debounceTime: 10
  });

  const firstPromise = tileset.selectTiles(createViewport());
  const secondPromise = tileset.selectTiles(createViewport());
  source.resolveTile('left');
  source.resolveTile('right');

  const [firstFrame, secondFrame] = await Promise.all([firstPromise, secondPromise]);
  t.equal(firstFrame, 1, 'first traversal resolves once');
  t.equal(secondFrame, 1, 'second traversal resolves to the same debounced frame');
  t.equal(tileset.frameNumber, 1, 'only one traversal was executed');
  t.end();
});
