// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Check reponse status, if not OK extract error message and throw error
 * @param response
 */
export async function checkFetchResponseStatus(response: Response): Promise<void> {
  if (!response.ok) {
    let errorMessage = `fetch failed ${response.status} ${response.statusText}`;
    try {
      const text = await response.text();
      if (text) {
        errorMessage += `: ${getErrorText(text)}`;
      }
    } catch (error) {
      // ignore error
    }
    throw new Error(errorMessage);
  }
}

/**
 * Check response status synchronously, if not OK extract error message and throw error
 * Not able to extract as good an error message as the async version
 * @param response
 */
export function checkFetchResponseStatusSync(response: Response): void {
  if (!response.ok) {
    throw new Error(`fetch failed ${response.status}`);
  }
}

/**
 * Ad-hoc error message extractor
 * @todo Handle XML, JSON, etc
 * @param text
 * @returns
 */
function getErrorText(text: string): string {
  // Look for HTML error texts
  const matches = /<pre>(.*)<\/pre>/.exec(text);
  return matches ? matches[1] : ` ${text.slice(0, 10)}...`;
}
