// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Forked from github AnthumChris/fetch-progress-indicators under MIT license

/**
 * Intercepts the Response stream and creates a new Response
 */
export async function fetchProgress(
  response: Response | Promise<Response>,
  onProgress: any, // TODO better callback types
  onDone = () => {},
  onError = () => {}
) {
  response = await response;
  if (!response.ok) {
    // ERROR checking needs to be done separately
    return response;
  }
  const body = response.body;
  if (!body) {
    // 'ReadableStream not yet supported in this browser.
    return response;
  }
  const contentLength = response.headers.get('content-length') || 0;
  const totalBytes = contentLength ? parseInt(contentLength) : 0;
  if (!(totalBytes > 0)) {
    return response;
  }
  // Currently override only implemented in browser
  if (typeof ReadableStream === 'undefined' || !body.getReader) {
    return response;
  }

  // Create a new stream that invisbly wraps original stream
  const progressStream = new ReadableStream({
    async start(controller) {
      const reader = body.getReader();
      await read(controller, reader, 0, totalBytes, onProgress, onDone, onError);
    }
  });

  return new Response(progressStream);
}

// Forward to original streams controller
// TODO - this causes a crazy deep "async stack"... rewrite as async iterator?
// eslint-disable-next-line max-params
async function read(
  controller: any,
  reader: any,
  loadedBytes: number,
  totalBytes: number,
  onProgress: Function,
  onDone: Function,
  onError: Function
): Promise<void> {
  try {
    const {done, value} = await reader.read();
    if (done) {
      onDone();
      controller.close();
      return;
    }
    loadedBytes += value.byteLength;
    const percent = Math.round((loadedBytes / totalBytes) * 100);
    onProgress(percent, {loadedBytes, totalBytes});
    controller.enqueue(value);
    await read(controller, reader, loadedBytes, totalBytes, onProgress, onDone, onError);
  } catch (error) {
    controller.error(error);
    onError(error);
  }
}
