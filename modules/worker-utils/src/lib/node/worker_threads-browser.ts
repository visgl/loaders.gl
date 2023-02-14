// Browser fills for Node.js built-in `worker_threads` module.
// These fills are non-functional, and just intended to ensure that
// `import 'worker_threads` doesn't break browser builds.
// The replacement is done in package.json browser field
export class Worker {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  terminate() {}
}

export {Worker as NodeWorker};
export {Worker as NodeWorkerType};

export const parentPort = null;
