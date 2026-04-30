// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Example} from '../pointcloud/examples';

const DECK_DATA_URI = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master';
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

/** Built-in Gaussian splat PLY examples shown in the Gaussian splats URL dropdown. */
export const GAUSSIAN_SPLAT_EXAMPLES: Record<string, Example> = {
  'Train 7K Full': {
    type: 'ply',
    url: GAUSSIAN_SPLAT_TRAIN_7K_URLS[0],
    urls: GAUSSIAN_SPLAT_TRAIN_7K_URLS,
    pointCount: 741883
  },
  'Train 7K Part 1': {
    type: 'ply',
    url: GAUSSIAN_SPLAT_TRAIN_7K_URLS[0],
    pointCount: 370941
  },
  'Train 7K Part 2': {
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
};

/** Default Gaussian splat example loaded when the app mounts. */
export const DEFAULT_GAUSSIAN_SPLAT_EXAMPLE_NAME = 'Train 7K Full';
