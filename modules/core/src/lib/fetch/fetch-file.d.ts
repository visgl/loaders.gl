// As fetch but respects pathPrefix and file aliases
// Reads file data from:
// * data urls
// * http/http urls
// * File/Blob objects
export function fetchFile(url: string | Blob, options?: object): Promise<Response>;
