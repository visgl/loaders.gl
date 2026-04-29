// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type Example = {
  type: 'las' | 'draco' | 'pcd' | 'ply' | 'obj';
  url: string;
  urls?: string[];
  pointCount?: number;
  initialExample?: boolean;
  attributions?: string[];
  viewState?: Record<string, unknown>;
  tileSize?: number[];
};

const DECK_DATA_URI = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master';
const LOADERS_URI = 'https://raw.githubusercontent.com/visgl/loaders.gl/master';
const HUGGING_FACE_VOXEL51_GAUSSIAN_SPLATTING_URI =
  'https://huggingface.co/datasets/Voxel51/gaussian_splatting/resolve/main';
const GAUSSIAN_SPLAT_TRAIN_7K_URLS = [
  `${DECK_DATA_URI}/formats/ply/gaussian-splat/train-iteration-7000-part-00.ply`,
  `${DECK_DATA_URI}/formats/ply/gaussian-splat/train-iteration-7000-part-01.ply`
];
const HUGGING_FACE_GAUSSIAN_SPLAT_ATTRIBUTION = [
  'Voxel51 Gaussian Splats Dataset, Apache-2.0',
  'Created using GraphDECO-INRIA 3D Gaussian Splatting'
];

export const EXAMPLES: Record<string, Record<string, Example>> = {
  PLY: {
    'Richmond Azaelias': {
      type: 'ply',
      url: `${LOADERS_URI}/modules/ply/test/data/richmond-azaelias.ply`,
      pointCount: 359610
    },
    'Lucy 800K': {
      type: 'ply',
      url: `${DECK_DATA_URI}/examples/point-cloud-ply/lucy800k.ply`,
      pointCount: 772191
    },
    'Lucy 100K': {
      type: 'ply',
      url: `${DECK_DATA_URI}/examples/point-cloud-ply/lucy100k.ply`,
      pointCount: 50002
    },
    Bunny: {
      type: 'ply',
      url: `${LOADERS_URI}/modules/ply/test/data/bunny.ply`,
      pointCount: 34834
    },
    'Bun Zipper (Text)': {
      type: 'ply',
      url: `${LOADERS_URI}/modules/ply/test/data/bun_zipper.ply`,
      pointCount: 35947
    },
    'Gaussian Splat Train 7K Full': {
      type: 'ply',
      url: GAUSSIAN_SPLAT_TRAIN_7K_URLS[0],
      urls: GAUSSIAN_SPLAT_TRAIN_7K_URLS,
      pointCount: 741883
    },
    'Gaussian Splat Train 7K Part 1': {
      type: 'ply',
      url: GAUSSIAN_SPLAT_TRAIN_7K_URLS[0],
      pointCount: 370941
    },
    'Gaussian Splat Train 7K Part 2': {
      type: 'ply',
      url: GAUSSIAN_SPLAT_TRAIN_7K_URLS[1],
      pointCount: 370942
    },
    'HF Voxel51 Train 7K': {
      type: 'ply',
      url: `${HUGGING_FACE_VOXEL51_GAUSSIAN_SPLATTING_URI}/FO_dataset/train/point_cloud/iteration_7000/point_cloud.ply`,
      pointCount: 741883,
      attributions: HUGGING_FACE_GAUSSIAN_SPLAT_ATTRIBUTION
    },
    'HF Voxel51 Dr Johnson 7K': {
      type: 'ply',
      url: `${HUGGING_FACE_VOXEL51_GAUSSIAN_SPLATTING_URI}/FO_dataset/drjohnson/point_cloud/iteration_7000/point_cloud.ply`,
      pointCount: 1913633,
      attributions: HUGGING_FACE_GAUSSIAN_SPLAT_ATTRIBUTION
    },
    'HF Voxel51 Playroom 7K': {
      type: 'ply',
      url: `${HUGGING_FACE_VOXEL51_GAUSSIAN_SPLATTING_URI}/FO_dataset/playroom/point_cloud/iteration_7000/point_cloud.ply`,
      pointCount: 1495461,
      attributions: HUGGING_FACE_GAUSSIAN_SPLAT_ATTRIBUTION
    },
    'HF Voxel51 Truck 7K': {
      type: 'ply',
      url: `${HUGGING_FACE_VOXEL51_GAUSSIAN_SPLATTING_URI}/FO_dataset/truck/point_cloud/iteration_7000/point_cloud.ply`,
      pointCount: 1692538,
      attributions: HUGGING_FACE_GAUSSIAN_SPLAT_ATTRIBUTION
    }
  },

  LAZ: {
    // Data source: kaarta.com
    'Indoor Scan 800K': {
      type: 'las',
      url: `${DECK_DATA_URI}/examples/point-cloud-laz/indoor.0.1.laz`
    },
    'LAS 1-4 example': {
      type: 'las',
      // TODO upload the file to deck data
      url: 'https://pub-0e04e4fabfef402d8789a24f6a393790.r2.dev/SerpentMound_LAS14_ExtraDims.laz'

    },
    // TODO need fix
    // 'Indoor Scan 8M': {
    //   type: 'las',
    //   url: `${DECK_DATA_URI}/examples/point-cloud-laz/indoor.laz`
    // },
  },

  Draco: {
    Bunny: {
      type: 'draco',
      url: `${LOADERS_URI}/modules/draco/test/data/bunny.drc`
    }
  },
  // TODO need fix
  PCD: {
    Zaghetto: {
      url: `${LOADERS_URI}/modules/pcd/test/data/Zaghetto.pcd`
    },
    'Simple (Text)': {
      url: `${LOADERS_URI}/modules/pcd/test/data/simple-ascii.pcd`
    }
  },

  OBJ: {
    Bunny: {
      type: 'obj',
      url: `${LOADERS_URI}/modules/obj/test/data/bunny.obj`
    },
    Magnolia: {
      type: 'obj',
      url: `${LOADERS_URI}/modules/obj/test/data/magnolia.obj`
    }
    // TODO need fix
    // Cube: {
    //   url: `${LOADERS_URI}/modules/obj/test/data/cube.obj`
    // }
  }
};
