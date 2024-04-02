// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// TODO - duplicates response-utils code
export function getErrorMessageFromResponseSync(response: Response): string {
  return `Failed to fetch resource ${response.url}(${response.status}): ${response.statusText} `;
}

// TODO - duplicates response-utils code
export async function getErrorMessageFromResponse(response: Response): Promise<string> {
  let message = `Failed to fetch resource ${response.url} (${response.status}): `;
  try {
    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
      message += await response.text();
    } else {
      message += response.statusText;
    }
  } catch (error) {
    // eslint forbids return in finally statement
    return message;
  }
  return message;
}
