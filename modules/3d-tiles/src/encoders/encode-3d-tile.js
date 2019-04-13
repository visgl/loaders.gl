import {TILE3D_TYPE} from '../constants';

import {encodeComposite3DTile} from './encode-3d-tile-composite';
import {encodeBatchedModel3DTile} from './encode-3d-tile-batched-model';
import {encodeInstancedModel3DTile} from './encode-3d-tile-instanced-model';
import {encodePointCloud3DTile} from './encode-3d-tile-point-cloud';

export default function encode3DTile(tile, options) {
  switch (tile.type) {
    case TILE3D_TYPE.COMPOSITE:
      return encodeComposite3DTile({...tile, ...options});
    case TILE3D_TYPE.POINTCLOUD:
      return encodePointCloud3DTile({...tile, ...options});
    case TILE3D_TYPE.MODEL_BATCHED:
      return encodeBatchedModel3DTile({...tile, ...options});
    case TILE3D_TYPE.MODEL_INSTANCED:
      return encodeInstancedModel3DTile({...tile, ...options});
    default:
      throw new Error();
  }
}
