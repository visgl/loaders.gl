import type {Mesh} from '@loaders.gl/schema';

type BoundingBox = [[number, number, number], [number, number, number]];

export type PCDHeader = {
  data: any;
  headerLen: number;
  str: string;
  version: number;
  fields: string[];
  size: number[];
  type: null | string[];
  count: null | number[];
  width: number;
  height: number;
  viewpoint: null | string;
  points: number;
  offset: {[index: string]: number};
  rowSize: number;
  vertexCount: number;
  boundingBox: BoundingBox;
};

/**  */
export type PCDMesh = Mesh & {
  loader: 'pcd';
  loaderData: PCDHeader;
  topology: 'point-list';
  mode: 0;
};
