/**
 * Returns a Response object
 * Adds content-length header when possible
 *
 * @param resource
 */
export function makeResponse(resource: any): Promise<Response>;

/**
 * Checks response status (async) and throws a helpful error message if status is not OK.
 * @param response
 */
export function checkResponse(response: Response): Promise<void>;

/**
 * Checks response status (sync) and throws a helpful error message if status is not OK.
 * @param response
 */
export function checkResponseSync(response: Response): void;
