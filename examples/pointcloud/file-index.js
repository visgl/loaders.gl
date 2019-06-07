const DECK_DATA_URI = 'https://raw.githubusercontent.com/uber-common/deck.gl-data/master';
const LOADERS_URI = 'https://raw.githubusercontent.com/uber-web/loaders.gl/master';

export default {
  PLY: {
    'Lucy 800K': {
      uri: `${DECK_DATA_URI}/examples/point-cloud-ply/lucy800k.ply`
    },
    'Lucy 100K': {
      uri: `${DECK_DATA_URI}/examples/point-cloud-ply/lucy100k.ply`
    },
    Bunny: {
      uri: `${LOADERS_URI}/modules/obj/test/data/bunny.obj`
    },
    'Bun Zipper (Text)': {
      uri: `${LOADERS_URI}/modules/ply/test/data/bun_zipper.ply`
    }
  },

  LAZ: {
    // Data source: kaarta.com
    'Indoor Scan 800K': {
      uri: `${DECK_DATA_URI}/examples/point-cloud-laz/indoor.0.1.laz`
    },
    'Indoor Scan 8M': {
      uri: `${DECK_DATA_URI}/examples/point-cloud-laz/indoor.laz`
    }
  },

  Draco: {
    Bunny: {
      uri: `${LOADERS_URI}/modules/draco/test/data/bunny.drc`
    }
  },

  PCD: {
    Zaghetto: {
      uri: `${LOADERS_URI}/modules/pcd/test/data/Zaghetto.pcd`
    },
    'Simple (Text)': {
      uri: `${LOADERS_URI}/modules/pcd/test/data/simple-ascii.pcd`
    }
  },

  OBJ: {
    Magnolia: {
      uri: `${LOADERS_URI}/modules/obj/test/data/magnolia.obj`
    },
    Bunny: {
      uri: `${LOADERS_URI}/modules/obj/test/data/bunny.obj`
    },
    Cube: {
      uri: `${LOADERS_URI}/modules/obj/test/data/cube.obj`
    }
  }
};
