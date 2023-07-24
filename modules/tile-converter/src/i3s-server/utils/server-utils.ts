import type {Server as HttpsServer} from 'https';
import type {Server as HttpServer} from 'http';

import debugFactory from 'debug';
const debug = debugFactory('i3s-server:server');

/**
 * Normalize a port into a number, string, or false.
 * @param val - port value from env variables
 * @returns - `number` for port, `string` for a named pipe, or `false` if the port number is not correct
 */
export function normalizePort(val: string): number | string | false {
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
 * Event listener creator for HTTP/HTTPS server "error" event.
 * @param optionalPort - the port/named pipe the server is started on
 * @return callback to handle server errors
 */
export function formErrorHandler(
  optionalPort: string | number
): (error: NodeJS.ErrnoException) => void {
  return function onError(error: NodeJS.ErrnoException) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof optionalPort === 'string' ? `Pipe ${optionalPort}` : `Port ${optionalPort}`;

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
 * @param optionalServer - http or https NodeJS server
 * @return callback that is triggered when the server has started
 */
export function formListeningHandler(optionalServer: HttpsServer | HttpServer): () => void {
  return function onListening() {
    const addr = optionalServer.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr?.port}`;
    debug(`Listening on ${bind}`);
  };
}
