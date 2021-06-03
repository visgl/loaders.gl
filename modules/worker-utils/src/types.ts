/**
 * A worker description
 */
export type WorkerObject = {
  name: string;
  id: string;
  module: string;
  version: string;
  worker?: string;
  options: object;
  deprecatedOptions?: object;

  process?: (data: any, options?: object) => Promise<any>;
  processInBatches?: (
    iterator: AsyncIterator<any> | Iterator<any>,
    options: object
  ) => Promise<AsyncIterator<any>>;
};
