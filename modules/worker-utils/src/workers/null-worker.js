import {createWorker} from '../lib/worker-utils/create-worker';

createWorker(async ({data, options = {}}) => {
  // @ts-ignore
  return data;
});
