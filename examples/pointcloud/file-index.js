
const DECK_DATA_URI = 'https://raw.githubusercontent.com/uber-common/deck.gl-data/master';
const LOADERS_URI = 'https://raw.githubusercontent.com/uber-web/loaders.gl/master';

// Data source: kaarta.com
export default [
  // LAZ
  {
    name: 'Indoor Scan 800K (LAZ)',
    uri: `${DECK_DATA_URI}/examples/point-cloud-laz/indoor.0.1.laz`
  },
  {
    name: 'Indoor Scan 8.1M (LAZ)',
    uri: `${DECK_DATA_URI}/examples/point-cloud-laz/indoor.laz`
  },

  // Draco
  {
    name: 'Bunny (DRC)',
    uri: `${LOADERS_URI}/modules/draco/bunny.drc`
  },

  // PCD
  {
    name: 'Zaghetto (PCD Binary)',
    uri: `${LOADERS_URI}/modules/pcd/Zaghetto.pcd`
  },
  {
    name: 'Simple (PCD Text)',
    uri: `${LOADERS_URI}/modules/obj/simple-ascii.pcd`
  },

  // PLY
  {
    name: 'Lucy 800K (PLY)',
    uri: `${DECK_DATA_URI}/examples/point-cloud-ply/lucy-800k.ply`
  },
  {
    name: 'Lucy 100K (PLY)',
    uri: `${DECK_DATA_URI}/examples/point-cloud-ply/lucy-100k.ply`
  },
  {
    name: 'Bunny (PLY Binary)',
    uri: `${LOADERS_URI}/modules/obj/bunny.ply`
  },
  {
    name: 'Bun Zipper (PLY Text)',
    uri: `${LOADERS_URI}/modules/ply/bun_zipper.ply`
  },

  // OBJ
  {
    name: 'Magnolia (OBJ)',
    uri: `${LOADERS_URI}/modules/obj/magnolia.obj`
  },
  {
    name: 'Bunny (OBJ)',
    uri: `${LOADERS_URI}/modules/obj/bunny.obj`
  },
  {
    name: 'Cube (OBJ)',
    uri: `${LOADERS_URI}/modules/obj/cube.obj`
  }
];
