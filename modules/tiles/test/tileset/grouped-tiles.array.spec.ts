import {GroupedTilesArray, TILE_REFINEMENT, Tile3D, Tileset3D} from '@loaders.gl/tiles';
import {Vector3} from '@math.gl/core';
import {TileGroup3D} from '../../dist/tileset/tile-group-3d';

const unitSphere = () => ({
  center: new Vector3(0, 0, 0),
  radius: 1
});

export const tileHeaders = () => ({
  refine: TILE_REFINEMENT.ADD,
  boundingVolume: {
    sphere: unitSphere()
  },
  // Defined in order to suppress console.warn messages.
  lodMetricType: 'geometricError',
  lodMetricValue: undefined
});

test('GroupedTilesArray#numTiles() returns 1 after a single tile is added', (t) => {
  const tileset = new Tileset3D({
    root: tileHeaders()
  });

  const tileGroups = new GroupedTilesArray();
  t.equals(tileGroups.numTiles(), 0);

  tileGroups.addTileOrGroup(new Tile3D(tileset, tileHeaders()));

  t.equals(tileGroups.numTiles(), 1);
});

test('GroupedTilesArray#numTiles() returns N after a TileGroup3D with N tiles is added', (t) => {
  const tileset = new Tileset3D({
    root: tileHeaders()
  });
  const tileGroup = new TileGroup3D();

  const NUM_TILES = 3;
  for (let i = 0; i < NUM_TILES; i++) {
    tileGroup.addTile(new Tile3D(tileset, tileHeaders()));
    tileGroup.addTile(new Tile3D(tileset, tileHeaders()));
    tileGroup.addTile(new Tile3D(tileset, tileHeaders()));
  }

  const tileGroups = new GroupedTilesArray();
  t.equals(tileGroups.numTiles(), 0);

  tileGroups.addTileOrGroup(tileGroup);

  t.equals(tileGroups.numTiles(), NUM_TILES);
});

test('GroupedTilesArray#numTiles() counts both individual tiles and tile groups', (t) => {
  const tileset = new Tileset3D({
    root: tileHeaders()
  });
  const tileGroup = new TileGroup3D();

  for (let i = 0; i < 3; i++) {
    tileGroup.addTile(new Tile3D(tileset, tileHeaders()));
    tileGroup.addTile(new Tile3D(tileset, tileHeaders()));
    tileGroup.addTile(new Tile3D(tileset, tileHeaders()));
  }

  const tileGroups = new GroupedTilesArray();
  t.equals(tileGroups.numTiles(), 0);

  tileGroups.addTileOrGroup(tileGroup);
  tileGroups.addTileOrGroup(new Tile3D(tileset, tileHeaders()));

  t.equals(tileGroups.numTiles(), tileGroup.tiles.length + 1);
});

test('GroupedTilesArray#numTiles() counts both individual tiles and tile groups', (t) => {
  const tileset = new Tileset3D({
    root: tileHeaders()
  });
  const tileGroup = new TileGroup3D();

  for (let i = 0; i < 3; i++) {
    tileGroup.addTile(new Tile3D(tileset, tileHeaders()));
    tileGroup.addTile(new Tile3D(tileset, tileHeaders()));
    tileGroup.addTile(new Tile3D(tileset, tileHeaders()));
  }

  const tileGroups = new GroupedTilesArray();
  t.equals(tileGroups.numTiles(), 0);

  tileGroups.addTileOrGroup(tileGroup);
  tileGroups.addTileOrGroup(new Tile3D(tileset, tileHeaders()));

  t.equals(tileGroups.numTiles(), tileGroup.tiles.length + 1);
});

test('GroupedTilesArray#spliceHighestPriorityTileOrGroup() removes the highest-priority element', (t) => {
  const tileset = new Tileset3D({
    root: tileHeaders()
  });

  const tileGroups = new GroupedTilesArray();

  // Lower positive numbers == higher priority; zero is the highest priority.
  const highPriorityTile = new Tile3D(tileset, tileHeaders());
  highPriorityTile._displayPriority = 0;

  const lowPriorityTile = new Tile3D(tileset, tileHeaders());
  lowPriorityTile._displayPriority = 100;

  tileGroups.addTileOrGroup(highPriorityTile);
  tileGroups.addTileOrGroup(lowPriorityTile);
  t.equals(tileGroups.numTiles(), 2);

  const tile = tileGroups.spliceHighestPriorityTileOrGroup();

  t.equals(tile, highPriorityTile);
  t.equals(tileGroups.numTiles(), 1);
});

test('GroupedTilesArray#spliceHighestPriorityTilesOrGroups() splices the entire array if the number of tiles to splice is zero', (t) => {
  const tileset = new Tileset3D({
    root: tileHeaders()
  });

  const tileGroups = new GroupedTilesArray();

  // Lower positive numbers == higher priority; zero is the highest priority.
  const highPriorityTile = new Tile3D(tileset, tileHeaders());
  highPriorityTile._displayPriority = 0;

  const mediumPriorityTile = new Tile3D(tileset, tileHeaders());
  mediumPriorityTile._displayPriority = 10;

  const lowPriorityTile = new Tile3D(tileset, tileHeaders());
  lowPriorityTile._displayPriority = 100;

  tileGroups.addTileOrGroup(highPriorityTile);
  tileGroups.addTileOrGroup(mediumPriorityTile);
  tileGroups.addTileOrGroup(lowPriorityTile);
  t.equals(tileGroups.numTiles(), 3);

  // setting the number of tiles to splice to zero means that the entire array
  // should be spliced (aka copied) and returned.
  const spliced = tileGroups.spliceHighestPriorityTilesOrGroups(/* maxNumTiles= */ 0);

  t.equals(spliced.numTiles(), 3);
  t.equals(tileGroups.numTiles(), 0);
});

test('GroupedTilesArray#spliceHighestPriorityTilesOrGroups() splices the entire array if the number of tiles to splice exceeds the number of tiles in the array', (t) => {
  const tileset = new Tileset3D({
    root: tileHeaders()
  });

  const tileGroups = new GroupedTilesArray();

  const tileGroup = new TileGroup3D();
  tileGroup.addTile(new Tile3D(tileset, tileHeaders()));
  tileGroup.addTile(new Tile3D(tileset, tileHeaders()));
  tileGroups.addTileOrGroup(tileGroup);

  tileGroups.addTileOrGroup(new Tile3D(tileset, tileHeaders()));

  t.equals(tileGroups.numTiles(), 3);

  // maxNumTiles exceeds the number of tiles in the array
  const spliced = tileGroups.spliceHighestPriorityTilesOrGroups(/* maxNumTiles= */ 4);

  t.equals(spliced.numTiles(), 3);
  t.equals(tileGroups.numTiles(), 0);
});

test('GroupedTilesArray#spliceHighestPriorityTilesOrGroups() splices the highest-priority tiles in the array', (t) => {
  const tileset = new Tileset3D({
    root: tileHeaders()
  });

  const tileGroups = new GroupedTilesArray();

  // Lower positive numbers == higher priority; zero is the highest priority.
  const highPriorityTile = new Tile3D(tileset, tileHeaders());
  highPriorityTile._displayPriority = 0;

  const mediumPriorityTile = new Tile3D(tileset, tileHeaders());
  mediumPriorityTile._displayPriority = 10;

  const lowPriorityTile = new Tile3D(tileset, tileHeaders());
  lowPriorityTile._displayPriority = 100;

  // Add tiles in display-priority-scrambled order.
  tileGroups.addTileOrGroup(lowPriorityTile);
  tileGroups.addTileOrGroup(highPriorityTile);
  tileGroups.addTileOrGroup(mediumPriorityTile);
  t.equals(tileGroups.numTiles(), 3);

  const spliced = tileGroups.spliceHighestPriorityTilesOrGroups(/* maxNumTiles= */ 2).flatten();

  t.equals(spliced.length, 2);
  t.equals(spliced[0], highPriorityTile);
  t.equals(spliced[1], mediumPriorityTile);
  t.equals(tileGroups.numTiles(), 1);
});
