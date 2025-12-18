// `@loaders.gl/draco` is an ESM package, so Node.js treats `.js` files as ES modules when executed directly.
// The prebuilt Node worker bundle is emitted as CommonJS, so we load it by compiling it as CommonJS.
/* @ts-expect-error TS doesn't like require in an ESM context */
const fs = require('node:fs');
/* @ts-expect-error TS doesn't like require in an ESM context */
const path = require('node:path');
/* @ts-expect-error TS doesn't like require in an ESM context */
const Module = require('node:module');

const filename = path.join(__dirname, '../../dist/draco-writer-worker-node.js');
const code = fs.readFileSync(filename, 'utf8');

const workerModule = new Module(filename);
workerModule.filename = filename;
// eslint-disable-next-line no-underscore-dangle
workerModule.paths = Module._nodeModulePaths(path.dirname(filename));
// eslint-disable-next-line no-underscore-dangle
workerModule._compile(code, filename);
