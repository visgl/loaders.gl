#!/usr/bin/env node

import {app} from '../app';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import {formErrorHandler, formListeningHandler, normalizePort} from '../utils/server-utils';

/** Get port from environment and store in Express. */
const httpPort = normalizePort(process.env.PORT || '80');
if (httpPort === false) {
  console.error(`Incorrect HTTP port`);
  process.exit(1);
}
const httpsPort = normalizePort(process.env.HTTPS_PORT || '443');
if (httpsPort === false) {
  console.error(`Incorrect HTTPs port`);
  process.exit(1);
}

/** Create HTTP server. */
const options = {
  key: fs.readFileSync(path.join(__dirname, '../certs/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../certs/cert.pem'))
};

const httpServer = http.createServer(app);
const httpsServer = https.createServer(options, app);

/** Listen on provided port, on all network interfaces. */
httpServer.listen(httpPort);
httpServer.on('error', formErrorHandler(httpPort));
httpServer.on('listening', formListeningHandler(httpServer));

httpsServer.listen(httpsPort);
httpsServer.on('error', formErrorHandler(httpsPort));
httpsServer.on('listening', formListeningHandler(httpsServer));
