import {Tile3D} from './tile-3d';
import {TileGroup3D} from './tile-group-3d';

export class GroupedTilesArray {
  constructor(private readonly array: (Tile3D | TileGroup3D)[] = []) {}

  addTileOrGroup(other: Tile3D | TileGroup3D) {
    this.array.push(other);
  }

  addTilesOrGroups(other: GroupedTilesArray) {
    this.array.push(...other.array);
  }

  numTiles() {
    return this.array.reduce(
      (total, group) => total + (group instanceof Tile3D ? 1 : group.tiles.length),
      /* initial value */ 0
    );
  }

  flatten(): Tile3D[] {
    return this.array.flatMap((element) => (element instanceof Tile3D ? element : element.tiles));
  }

  forEach(callback: (tile: Tile3D) => void) {
    for (const element of this.array) {
      if (element instanceof Tile3D) {
        callback(element);
      } else {
        element.tiles.forEach(callback);
      }
    }
  }

  /**
   * Very similar to {@link spliceHighestPriorityTilesOrGroups}, but with two key differences:
   *   1. If the highest-priority element is a group with multiple tiles,
   *      {@link spliceHighestPriorityTilesOrGroups(1)} would return an empty array,
   *      whereas this will return the group.
   *   2. This is more efficient because it only performs the O(n) comparisons required to
   *      find the min. It does not sort the entire array.
   */
  spliceHighestPriorityTileOrGroup(): Tile3D | TileGroup3D | undefined {
    let minDisplayPriority = Number.MAX_VALUE;
    let minIndex = -1;
    for (let i = 0; i < this.array.length; i++) {
      const group = this.array[i];
      if (group._displayPriority < minDisplayPriority) {
        minDisplayPriority = group._displayPriority;
        minIndex = i;
      }
    }

    if (minIndex === -1) {
      return undefined;
    }

    this.array.splice(minIndex, 1);

    return this.array[minIndex];
  }

  spliceHighestPriorityTilesOrGroups(maxNumTiles: number): GroupedTilesArray {
    if (maxNumTiles === 0 || this.numTiles() <= maxNumTiles) {
      return this;
    }

    this.array.sort((a, b) => a._displayPriority - b._displayPriority);

    let i = 0;
    let prospectiveSelectedTilesCount = 0;
    for (i = 0; i < this.array.length - 1; i++) {
      // Look ahead, see if the next element would overspill the maxNumTiles, and if so,
      // return everything up to (but not including) the next element in order to stay
      // strictly below the maxNumTiles limit.
      const element = this.array[i + 1];
      prospectiveSelectedTilesCount += element instanceof Tile3D ? 1 : element.tiles.length;
      if (prospectiveSelectedTilesCount > maxNumTiles) {
        break;
      }
    }

    const selectedTileGroups = this.array.splice(0, i);

    return new GroupedTilesArray(selectedTileGroups);
  }
}
