// Development-only source worker factory. This file is injected only into browser dev builds.
export const PARQUET_SOURCE_WORKER_LOAD_WORKER = () =>
  typeof Worker !== 'undefined'
    ? new Worker(
        new URL('../../../modules/parquet/src/workers/parquet-source-worker.ts', import.meta.url),
        {type: 'module'}
      )
    : null;
