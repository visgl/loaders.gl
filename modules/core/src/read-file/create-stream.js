/* global fetch */
/* global URL */
import fs from 'fs'; // `fs` will be empty object in browsers (see package.json "browser" field).
import http from 'http';
import https from 'https';

import {resolvePath} from './file-aliases';

const isNode = Boolean(fs && fs.createReadStream);

export async function createReadStream(uri, options) {
  uri = resolvePath(uri);
  try {
    // NODE
    const isRequest = uri.startsWith('http:') || uri.startsWith('https:');

    if (isNode) {
      if (isRequest) {
        return new Promise((resolve, reject) => {
          options = {...new URL(uri), ...options};
          const request = uri.startsWith('https:') ? https.request : http.request;
          request(uri, response => resolve(response));
        });
      }

      return Promise.resolve(fs.createReadStream(uri, options));
    }

    return fetch(uri, options)
      // Retrieve body as a ReadableStream
      .then(res => res.body);
  } catch (error) {
    return Promise.reject(error);
  }
}
