import VectorTileLayer from './vector-tile-layer';
import Protobuf from 'pbf';

export default class VectorTile {
  constructor(pbf: Protobuf, end?);
  layers: VectorTileLayer[];
}
