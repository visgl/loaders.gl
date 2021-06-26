export type Field = any;

export type Schema = {
  [key: string]: Field;
};

export type Batch = {
  data: any;
  schema: Schema;
  length: number;
  bytesUsed?: number;
  count?: number;
  cursor?: number;
};
