/**
 * Determines if a loader can parse with worker
 * @param loader
 * @param data
 * @param options
 * @param context
 */
export function canParseWithWorker(loader, data, options, context?);

/**
 * this function expects that the worker function sends certain messages,
 * this can be automated if the worker is wrapper by a call to createLoaderWorker in @loaders.gl/loader-utils.
 */
export function parseWithWorker(loader, data, options, context?, parseOnMainThread?: Function);
