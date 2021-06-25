/**
 * Worker Options
 */
export type WorkerOptions = {
  _workerType?: string;
  [key: string]: any;
};

/**
 * A worker description object
 */
export type WorkerObject = {
  name: string;
  id: string;
  module: string;
  version: string;
  worker?: string | boolean;
  options: object;
  deprecatedOptions?: object;

  process?: (data: any, options?: object) => Promise<any>;
  processInBatches?: (
    iterator: AsyncIterator<any> | Iterator<any>,
    options: object
  ) => Promise<AsyncIterator<any>>;
};
