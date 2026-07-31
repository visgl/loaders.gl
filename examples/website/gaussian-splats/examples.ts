// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const DECK_DATA_URI = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master';
const HUGGING_FACE_VOXEL51_GAUSSIAN_SPLATTING_URI =
  'https://huggingface.co/datasets/Voxel51/gaussian_splatting/resolve/main';

const GAUSSIAN_SPLAT_TRAIN_7K_URLS = [
  `${DECK_DATA_URI}/formats/ply/gaussian-splat/train-iteration-7000-part-00.ply`,
  `${DECK_DATA_URI}/formats/ply/gaussian-splat/train-iteration-7000-part-01.ply`
];
const LOCAL_SPZ_FIXTURE_URL = '/data/two-splats.spz';
const SPARK_RAD_URI = 'https://storage.googleapis.com/forge-dev-public/asundqui/rad/260217';

const HUGGING_FACE_GAUSSIAN_SPLAT_ATTRIBUTION = [
  'Voxel51 Gaussian Splats Dataset, Apache-2.0',
  'Created using GraphDECO-INRIA 3D Gaussian Splatting'
];

/** Gaussian splat example source shown in the Gaussian splats URL dropdown. */
export type GaussianSplatExample = {
  /** Source file format. */
  type: 'ply' | 'splat' | 'ksplat' | 'spz' | 'rad';
  /** Primary source URL. */
  url: string;
  /** Optional multi-part source URLs. */
  urls?: string[];
  /** Parsed splat count when known. */
  pointCount?: number;
  /** Optional source attribution lines. */
  attributions?: string[];
};

/** Built-in Gaussian splat examples shown in the Gaussian splats URL dropdown. */
export const GAUSSIAN_SPLAT_EXAMPLES: Record<string, GaussianSplatExample> = {
  'Local SPZ v4 Fixture': {
    type: 'spz',
    url: LOCAL_SPZ_FIXTURE_URL,
    pointCount: 2,
    attributions: ['Generated deterministic SPZ v4 fixture for loader smoke testing']
  },
  'Spark Coit Tower RAD LoD': {
    type: 'rad',
    url: `${SPARK_RAD_URI}/coit-40m-sh1-lod.rad`,
    pointCount: 50937127,
    attributions: ['Spark RAD LoD example asset']
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
  },
  'deck.gl-data Train 7K Part 1': {
    type: 'ply',
    url: GAUSSIAN_SPLAT_TRAIN_7K_URLS[0],
    pointCount: 370941
  },
  'deck.gl-data Train 7K Part 2': {
    type: 'ply',
    url: GAUSSIAN_SPLAT_TRAIN_7K_URLS[1],
    pointCount: 370942
  }
};

/** Default Gaussian splat example loaded when the app mounts. */
export const DEFAULT_GAUSSIAN_SPLAT_EXAMPLE_NAME = 'Spark Coit Tower RAD LoD';
