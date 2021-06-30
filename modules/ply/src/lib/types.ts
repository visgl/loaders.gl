export type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Uint8ClampedArray
  | Float32Array
  | Float64Array;

export type PlyAccessors = {
  [index: string]: {
    value: TypedArray;
    size: number;
    normalized?: boolean;
  };
};

export type PlyHeader = {
  format?: string;
  comments: string[];
  elements: any[];
  version?: string;
  headerLength?: number;
};

export type NormalizeHeader = {
  vertexCount?: number;
  boundingBox?: [[number, number, number], [number, number, number]];
};

export type PlyAttributes = {
  [index: string]: number[];
};

export type PlyProperty = {
  [index: string]: string;
};

export type PlyData = {
  loaderData: {header: NormalizeHeader};
  header: NormalizeHeader;
  attributes: PlyAccessors;
  mode: any;
  indices: {value: ArrayBufferLike; size: number};
  options?: {};
};

export type ASCIIElement = {
  name: string;
  count: number;
  properties: any[];
};
