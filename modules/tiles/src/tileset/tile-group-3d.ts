import {Tile3D} from './tile-3d';

export class TileGroup3D {
  _displayPriority = Number.MAX_VALUE;
  tiles: Tile3D[] = [];

  addTile(tile: Tile3D) {
    this.tiles.push(tile);
    this._displayPriority = Math.min(this._displayPriority, tile._screenSpaceError);
  }
}
