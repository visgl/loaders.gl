#!/usr/bin/env node

/**
 * Module dependencies.
 */

import {app} from '../app';
import debugFactory from 'debug';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

const debug = debugFactory('i3s-server:server');

/**
 * Get port from environment and store in Express.
 */

const httpPort = normalizePort(process.env.PORT || '80'); // eslint-disable-line no-process-env, no-undef
const httpsPort = normalizePort(process.env.HTTPS_PORT || '443'); // eslint-disable-line no-process-env, no-undef

/**
 * Create HTTP server.
 */

const options = {
  key: fs.readFileSync(path.join(__dirname, '../certs/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../certs/cert.pem'))
};

const httpServer = http.createServer(app);
const httpsServer = https.createServer(options, app);

/**
 * Listen on provided port, on all network interfaces.
 */

httpServer.listen(httpPort);
httpServer.on('error', formErrorHandler(httpPort));
httpServer.on('listening', formListeningHandler(httpServer));

httpsServer.listen(httpsPort);
httpsServer.on('error', formErrorHandler(httpsPort));
httpsServer.on('listening', formListeningHandler(httpsServer));

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const chkPort = parseInt(val, 10);

  if (isNaN(chkPort)) {
    // named pipe
    return val;
  }

  if (chkPort >= 0) {
    // port number
    return chkPort;
  }

  return false;
}

/**
 * Event listener for HTTP/HTTPS server "error" event.
 */

function formErrorHandler(optionalPort) {
  return function onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof global.port === 'string' ? `Pipe ${optionalPort}` : `Port ${optionalPort}`;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(`${bind} requires elevated privileges`); // eslint-disable-line no-console, no-undef
        process.exit(1); // eslint-disable-line no-process-exit, no-undef
        break;
      case 'EADDRINUSE':
        console.error(`${bind} is already in use`); // eslint-disable-line no-console, no-undef
        process.exit(1); // eslint-disable-line no-process-exit, no-undef
        break;
      default:
        throw error;
    }
  };
}

/**
 * Event listener for HTTP/HTTPS server "listening" event.
 */
function formListeningHandler(optionalServer) {
  return function onListening() {
    const addr = optionalServer.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
    debug(`Listening on ${bind}`);
  };
}
