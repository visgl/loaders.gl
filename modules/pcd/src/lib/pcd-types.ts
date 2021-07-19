import type {Mesh} from '@loaders.gl/schema';

type BoundingBox = [[number, number, number], [number, number, number]];

export type PCDHeader = {
  data: any;
  headerLen: number;
  str: string;
  version: RegExpExecArray | null | number;
  fields: RegExpExecArray | null | string[];
  size: RegExpExecArray | null | number[];
  type: RegExpExecArray | null | string[];
  count: RegExpExecArray | null | number[];
  width: RegExpExecArray | number;
  height: RegExpExecArray | number;
  viewpoint: RegExpExecArray | null | string;
  points: RegExpExecArray | number;
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
