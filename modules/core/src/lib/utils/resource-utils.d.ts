/**
 * Returns an object with `url` and (MIME) `type` fields
 * If it cannot determine url or type, the corresponding value will be an empty string
 *
 * @param resource Any type, but only Responses, string URLs and data URLs are processed
 *
 * @todo string parameters are assumed to be URLs
 */
export function getResourceUrlAndType(resource: any): {url: string; type: string};

/**
 * Returns (approximate) content length for a resource if it can be determined.
 * Returns -1 if content length cannot be determined.
 * @param resource

 * @note string parameters are NOT assumed to be URLs
 */
export function getResourceContentLength(resource: any): number;
