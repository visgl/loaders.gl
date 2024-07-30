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

export type PotreeAttribute =
  | 'POSITION_CARTESIAN'
  | 'RGBA_PACKED'
  | 'COLOR_PACKED'
  | 'RGB_PACKED'
  | 'NORMAL_FLOATS'
  | 'FILLER_1B'
  | 'INTENSITY'
  | 'CLASSIFICATION'
  | 'NORMAL_SPHEREMAPPED'
  | 'NORMAL_OCT16'
  | 'NORMAL';

export type HierarchyItem = [string, number];

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
