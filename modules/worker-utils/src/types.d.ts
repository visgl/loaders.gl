/**
 * A worker description
 */
export type WorkerObject = {
  id: string;
  name: string;
  module: string;
  version: string;
  options: object;
  deprecatedOptions?: object;
};
