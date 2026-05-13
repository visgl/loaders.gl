#!/usr/bin/env node

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const DEFAULT_PORT = 9000;
const DEFAULT_HOST = '127.0.0.1';
const BOUNDARY_PREFIX = 'loaders-gl-range-server';

/**
 * Starts the range-data server when this module is invoked as a command-line entry point.
 */
async function main() {
  const options = parseCommandLineOptions(process.argv.slice(2));

  if (options.help || !options.root) {
    printUsage(options.help ? process.stdout : process.stderr);
    process.exitCode = options.help ? 0 : 1;
    return;
  }

  const rootDirectory = path.resolve(options.root);
  const rootStat = await fs.promises.stat(rootDirectory).catch(() => null);
  if (!rootStat?.isDirectory()) {
    throw new Error(`--root must point to an existing directory: ${rootDirectory}`);
  }

  const server = createRangeServer({
    rootDirectory,
    corsOrigin: options.corsOrigin
  });

  await listen(server, options.port, options.host);

  const origin = `http://${options.host}:${options.port}`;
  console.log(`loaders.gl range server`);
  console.log(`  origin: ${origin}`);
  console.log(`  root:   ${rootDirectory}`);
  console.log(`  CORS:   ${options.corsOrigin}`);
  console.log(`  usage:  fetch('${origin}/path/from/root.pmtiles')`);
}

/**
 * Creates an HTTP server that can serve regular responses, single ranges, and multipart ranges.
 */
export function createRangeServer(options) {
  const serveRangeRequest = createRangeServerMiddleware({
    rootDirectory: options.rootDirectory,
    corsOrigin: options.corsOrigin
  });

  return http.createServer((request, response) => {
    serveRangeRequest(request, response, error => {
      if (!response.headersSent) {
        writeCorsHeaders(response, options.corsOrigin || '*');
        response.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
      }
      response.end(`${error.message}\n`);
    });
  });
}

/**
 * Creates middleware that serves files with regular, single-range, and multipart-range responses.
 *
 * Set `fallthrough` when mounting this inside another development server so unmatched requests can
 * continue to that server's normal static-file handling.
 */
export function createRangeServerMiddleware(options) {
  const rootDirectory = path.resolve(options.rootDirectory);
  const corsOrigin = options.corsOrigin || '*';
  const fallthrough = Boolean(options.fallthrough);
  const resolveFilePath = options.resolveFilePath || getRequestFilePath;

  return (request, response, next = undefined) => {
    void handleRangeServerRequest(request, response, {
      corsOrigin,
      fallthrough,
      resolveFilePath,
      rootDirectory
    })
      .then(handled => {
        if (!handled && next) {
          next();
        }
      })
      .catch(error => {
        if (next) {
          next(error);
          return;
        }

        if (!response.headersSent) {
          writeCorsHeaders(response, corsOrigin);
          response.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
        }
        response.end(`${error.message}\n`);
      });
  };
}

/**
 * Handles one HTTP request against the range-data server.
 */
async function handleRangeServerRequest(
  request,
  response,
  {rootDirectory, corsOrigin, fallthrough, resolveFilePath}
) {
  if (fallthrough && request.method === 'OPTIONS') {
    return false;
  }

  if (request.method === 'OPTIONS') {
    writeCorsHeaders(response, corsOrigin);
    response.writeHead(204);
    response.end();
    return true;
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (fallthrough) {
      return false;
    }
    writeCorsHeaders(response, corsOrigin);
    response.writeHead(405, {
      Allow: 'GET, HEAD, OPTIONS',
      'Content-Type': 'text/plain; charset=utf-8'
    });
    response.end('Method Not Allowed\n');
    return true;
  }

  const filePath = resolveFilePath(request.url, rootDirectory);
  if (!filePath) {
    if (fallthrough) {
      return false;
    }
    writeCorsHeaders(response, corsOrigin);
    response.writeHead(403, {'Content-Type': 'text/plain; charset=utf-8'});
    response.end('Forbidden\n');
    return true;
  }

  const fileStat = await fs.promises.stat(filePath).catch(() => null);
  if (!fileStat?.isFile()) {
    if (fallthrough) {
      return false;
    }
    writeCorsHeaders(response, corsOrigin);
    response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
    response.end('Not Found\n');
    return true;
  }

  writeCorsHeaders(response, corsOrigin);

  const rangeHeader = request.headers.range;
  if (!rangeHeader) {
    if (fallthrough) {
      return false;
    }
    serveFullResponse(request, response, filePath, fileStat.size);
    return true;
  }

  const ranges = parseRangeHeader(rangeHeader, fileStat.size);
  if (!ranges) {
    response.writeHead(400, {'Content-Type': 'text/plain; charset=utf-8'});
    response.end('Malformed Range header\n');
    return true;
  }

  if (ranges.length === 0) {
    response.writeHead(416, {
      'Accept-Ranges': 'bytes',
      'Content-Range': `bytes */${fileStat.size}`
    });
    response.end();
    return true;
  }

  if (ranges.length === 1) {
    serveSingleByteRange(request, response, filePath, ranges[0], fileStat.size);
    return true;
  }

  await serveMultipartByteRanges(request, response, filePath, ranges, fileStat.size);
  return true;
}

/**
 * Serves a complete file response.
 */
function serveFullResponse(request, response, filePath, fileSize) {
  response.writeHead(200, {
    'Accept-Ranges': 'bytes',
    'Content-Length': String(fileSize),
    'Content-Type': 'application/octet-stream'
  });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  fs.createReadStream(filePath).pipe(response);
}

/**
 * Serves one inclusive byte range from a file.
 */
function serveSingleByteRange(request, response, filePath, range, fileSize) {
  response.writeHead(206, {
    'Accept-Ranges': 'bytes',
    'Content-Length': String(range.end - range.start + 1),
    'Content-Range': `bytes ${range.start}-${range.end}/${fileSize}`,
    'Content-Type': 'application/octet-stream'
  });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  fs.createReadStream(filePath, range).pipe(response);
}

/**
 * Serves several inclusive byte ranges as a multipart/byteranges response.
 */
async function serveMultipartByteRanges(request, response, filePath, ranges, fileSize) {
  const boundary = `${BOUNDARY_PREFIX}-${Date.now().toString(36)}`;
  response.writeHead(206, {
    'Accept-Ranges': 'bytes',
    'Content-Type': `multipart/byteranges; boundary=${boundary}`
  });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  for (const range of ranges) {
    response.write(
      `--${boundary}\r\n` +
        'Content-Type: application/octet-stream\r\n' +
        `Content-Range: bytes ${range.start}-${range.end}/${fileSize}\r\n\r\n`
    );
    await writeFileRange(response, filePath, range);
    response.write('\r\n');
  }

  response.end(`--${boundary}--\r\n`);
}

/**
 * Parses the process arguments accepted by the range-server command.
 */
function parseCommandLineOptions(argumentsList) {
  const options = {
    corsOrigin: '*',
    help: false,
    host: process.env.LOADERS_GL_RANGE_SERVER_HOST || DEFAULT_HOST,
    port: Number(process.env.LOADERS_GL_RANGE_SERVER_PORT || DEFAULT_PORT),
    root: process.env.LOADERS_GL_RANGE_SERVER_ROOT || ''
  };

  for (let index = 0; index < argumentsList.length; index++) {
    const argument = argumentsList[index];
    if (argument === '--help' || argument === '-h') {
      options.help = true;
    } else if (argument === '--root') {
      options.root = requireCommandLineValue(argument, argumentsList[++index]);
    } else if (argument === '--port') {
      options.port = Number(requireCommandLineValue(argument, argumentsList[++index]));
    } else if (argument === '--host') {
      options.host = requireCommandLineValue(argument, argumentsList[++index]);
    } else if (argument === '--cors-origin') {
      options.corsOrigin = requireCommandLineValue(argument, argumentsList[++index]);
    } else if (!argument.startsWith('--') && !options.root) {
      options.root = argument;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!Number.isInteger(options.port) || options.port <= 0) {
    throw new Error(`--port must be a positive integer: ${options.port}`);
  }

  return options;
}

/**
 * Returns a required command-line option value.
 */
function requireCommandLineValue(optionName, value) {
  if (!value || value.startsWith('--')) {
    throw new Error(`${optionName} requires a value`);
  }
  return value;
}

/**
 * Resolves an HTTP request URL to a file path inside the configured root directory.
 */
function getRequestFilePath(url, rootDirectory) {
  if (!url) {
    return null;
  }

  const pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  const filePath = path.resolve(rootDirectory, `.${pathname}`);
  return isFilePathInside(filePath, rootDirectory) ? filePath : null;
}

/**
 * Parses an HTTP Range header into normalized inclusive byte ranges.
 */
function parseRangeHeader(rangeHeader, fileSize) {
  if (!rangeHeader.startsWith('bytes=')) {
    return null;
  }

  const ranges = [];
  for (const rangeText of rangeHeader.slice('bytes='.length).split(',')) {
    const range = parseRangeText(rangeText.trim(), fileSize);
    if (range) {
      ranges.push(range);
    }
  }
  return ranges;
}

/**
 * Parses one byte-range-set value.
 */
function parseRangeText(rangeText, fileSize) {
  const match = /^(\d*)-(\d*)$/.exec(rangeText);
  if (!match) {
    return null;
  }

  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!suffixLength) {
      return null;
    }
    return {
      start: Math.max(fileSize - suffixLength, 0),
      end: fileSize - 1
    };
  }

  const start = Number(match[1]);
  const end = Math.min(match[2] ? Number(match[2]) : fileSize - 1, fileSize - 1);
  return start < fileSize && end >= start ? {start, end} : null;
}

/**
 * Pipes one file range to a response without ending the response.
 */
function writeFileRange(response, filePath, range) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath, range);
    fileStream.on('error', reject);
    fileStream.on('end', resolve);
    fileStream.pipe(response, {end: false});
  });
}

/**
 * Writes CORS and range-related headers expected by browser examples.
 */
function writeCorsHeaders(response, corsOrigin) {
  response.setHeader('Access-Control-Allow-Origin', corsOrigin);
  response.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
  response.setHeader('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Length, Content-Range, Content-Type');
}

/**
 * Returns true when a resolved path is inside a resolved parent directory.
 */
function isFilePathInside(filePath, parentDirectory) {
  const relativePath = path.relative(parentDirectory, filePath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

/**
 * Starts an HTTP server and resolves when it is listening.
 */
function listen(server, port, host) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolve();
    });
  });
}

/**
 * Prints command-line usage.
 */
function printUsage(stream) {
  stream.write(`Serve local byte-range fixtures for loaders.gl examples.

Usage:
  yarn serve-range --root <directory> [--port 9000] [--host 127.0.0.1]

Options:
  --root <directory>       Directory to expose over HTTP.
  --port <port>            Listening port. Defaults to ${DEFAULT_PORT}.
  --host <host>            Listening host. Defaults to ${DEFAULT_HOST}.
  --cors-origin <origin>   Access-Control-Allow-Origin value. Defaults to *.

Supports:
  Range: bytes=0-99
  Range: bytes=0-99,200-299
  Range: bytes=-1024
`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
