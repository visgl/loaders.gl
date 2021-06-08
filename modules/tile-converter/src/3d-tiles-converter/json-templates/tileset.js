import transform from 'json-map-transform';

const ASSET = {
  version: {
    path: 'version',
    default: '1.0'
  }
};

const TILE = {
  boundingVolume: {
    path: 'boundingVolume'
  },
  geometricError: {
    path: 'geometricError'
  },
  content: {
    path: 'content'
  },
  children: {
    path: 'children',
    transform: (val) => val.map((tile) => transform(tile, TILE))
  }
};

export const TILESET = {
  asset: {
    path: 'asset',
    transform: (val) => transform(val, ASSET)
  },
  geometricError: {
    path: 'root',
    transform: (val) => val.geometricError
  },
  root: {
    path: 'root',
    transform: (val) => transform(val, TILE)
  }
};
