// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Bounding box */
export interface PotreeBoundingBox {
  /** Min X */
  lx: number;
  /** Min Y */
  ly: number;
  /** Min Z */
  lz: number;
  /** Max X */
  ux: number;
  /** Max Y */
  uy: number;
  /** Max Z */
  uz: number;
}

/** Attribute types for *.bin content */
export type PotreeAttribute =
  /** 3 (uint32) numbers: x, y, z */
  | 'POSITION_CARTESIAN'
  /** 4 x (uint8) numbers for the color: r, g, b, a */
  | 'RGBA_PACKED'
  /** 4 x (uint8) numbers for the color: r, g, b, a */
  | 'COLOR_PACKED'
  /** 3 x (uint8) numbers for the color: r, g, b */
  | 'RGB_PACKED'
  /** 3 x (float) numbers: x', y', z'  */
  | 'NORMAL_FLOATS'
  /** (uint8) number */
  | 'FILLER_1B'
  /** (uint16) number specifying the point's intensity */
  | 'INTENSITY'
  /** (uint8) id for the class used */
  | 'CLASSIFICATION'
  /** Note: might need to be revisited, best don't use */
  | 'NORMAL_SPHEREMAPPED'
  /** Note: might need to be revisited, best don't use */
  | 'NORMAL_OCT16'
  /** 3 x (float) numbers: x', y', z' */
  | 'NORMAL';

/** Hierarchy item: [node name leading with 'r', points count
 * @example [r043, 145]
] */
export type HierarchyItem = [string, number];

/**
 * Potree data set format metadata (cloud.js)
 * @version 1.7
 * @link https://github.com/potree/potree/blob/1.7/docs/potree-file-format.md
 * */
export interface PotreeMetadata {
  /** Version number in which this file is written */
  version: string;
  /** Folder that is used to load additional data */
  octreeDir: string;
  /** Amount of points contained in the whole pointcloud data */
  points: number;
  /**
   * This parameter is used to transform the point data
   * to the projection system used while visualizing the points. It has to be
   * in a format that is parsable by [proj.4][proj4].
   * */
  projection: string;
  /** Bounding box of the world used to limit the initial POV. */
  boundingBox: PotreeBoundingBox;
  /** Bounding box of the actual points in the data */
  tightBoundingBox: PotreeBoundingBox;
  /** Description of point attributes in data files */
  pointAttributes: 'LAS' | 'LAZ' | PotreeAttribute[];
  /**
   * Space between points at the root node.
   * This value is halved at each octree level.
   * */
  spacing: number;
  /**
   * Scale applied to convert POSITION_CARTESIAN components
   * from uint32 values to floating point values. The full transformation
   * to world coordinates is
   * position = (POSITION_CARTESIAN * scale) + boundingBox.min
   * */
  scale: number;
  /** Amount of Octree levels before a new folder hierarchy is expected. */
  hierarchyStepSize: number;
  /**
   * The hierarchy of files, now loaded through index files.
   * @deprecated
   * */
  hierarchy: HierarchyItem[];
}
