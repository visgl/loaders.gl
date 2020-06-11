export type Field = Date | Float32Array | String;

export type Schema = {
  [key: string]: Field;
};

export type Batch = {
  data: any;
  schema: Schema;
  length: number;
  bytesRead: number;
};
