#!/usr/bin/env node

import {app} from '../app';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
// For local debug
// import {fileURLToPath} from 'url';
import {formErrorHandler, formListeningHandler, normalizePort} from '../utils/server-utils';

// For local debug
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

/** Get port from environment and store in Express. */
const httpPort = normalizePort(process.env.PORT || '80');
if (httpPort === false) {
  // eslint-disable-next-line no-console
  console.error('Incorrect HTTP port');
  process.exit(1); // eslint-disable-line no-process-exit
}
const httpsPort = normalizePort(process.env.HTTPS_PORT || '443');
if (httpsPort === false) {
  // eslint-disable-next-line no-console
  console.error('Incorrect HTTPs port');
  process.exit(1); // eslint-disable-line no-process-exit
}

/** Create HTTP server. */
const options = {
  key: fs.readFileSync(path.join(__dirname, '../certs/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../certs/cert.pem'))
};

if (!app) {
  // eslint-disable-next-line no-console
  console.error('This server supports *.slpk files only');
  process.exit(1); // eslint-disable-line no-process-exit
}

const httpServer = http.createServer(app);
const httpsServer = https.createServer(options, app);

/** Listen on provided port, on all network interfaces. */
httpServer.listen(httpPort);
httpServer.on('error', formErrorHandler(httpPort));
httpServer.on('listening', formListeningHandler(httpServer));

httpsServer.listen(httpsPort);
httpsServer.on('error', formErrorHandler(httpsPort));
httpsServer.on('listening', formListeningHandler(httpsServer));
