/**
 * Intercepts the Response stream and creates a new Response
 */
export default function fetchProgress(
  response: Response | Promise<Response>,
  onProgress: any, // TODO better callback types
  onDone?: any,
  onError?: any
);
