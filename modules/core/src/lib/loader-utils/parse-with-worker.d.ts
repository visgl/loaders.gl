export function canParseWithWorker(loader, data, options, context?);

/**
 * this function expects that the worker function sends certain messages,
 * this can be automated if the worker is wrapper by a call to createWorker in @loaders.gl/loader-utils.
 */
export default function parseWithWorker(loader, data, options, context?);
