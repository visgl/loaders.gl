// Fork of https://github.com/floatdrop/require-from-string/blob/master/index.js
// Copyright (c) Vsevolod Strukchinsky <floatdrop@gmail.com> (github.com/floatdrop)
// MIT license

/* global process */
import Module from 'module';
import path from 'path';

// Node.js Dynamically require from file
// Relative names are resolved relative to cwd
// This indirect function is provided because webpack will try to bundle `module.require`.
// this file is not visible to webpack (it is excluded in the package.json "browser" field).
export function requireFromFile(filename) {
  if (filename.startsWith('http')) {
    throw new Error(`require from remote script not supported in Node.js: ${filename}`);
  }
  if (!filename.startsWith('/')) {
    filename = `${process.cwd()}/${filename}`;
  }
  return require(filename);
}

// Dynamically require from string
// - `code` - Required - Type: string - Module code.
// - `filename` - Type: string - Default: '' - Optional filename.
// - `options.appendPaths` Type: Array List of paths, that will be appended to module paths.
// Useful, when you want to be able require modules from these paths.
// - `options.prependPaths` Type: Array Same as appendPaths, but paths will be prepended.
export function requireFromString(code, filename = '', options = {}) {
  if (typeof filename === 'object') {
    options = filename;
    filename = undefined;
  }

  options = {
    appendPaths: [],
    prependPaths: [],
    ...options
  };

  if (typeof code !== 'string') {
    throw new Error(`code must be a string, not ${typeof code}`);
  }

  // @ts-ignore
  const paths = Module._nodeModulePaths(path.dirname(filename));

  const parent = module.parent;
  // @ts-ignore
  const newModule = new Module(filename, parent);
  newModule.filename = filename;
  newModule.paths = []
    .concat(options.prependPaths)
    .concat(paths)
    .concat(options.appendPaths);
  newModule._compile(code, filename);

  if (parent && parent.children) {
    parent.children.splice(parent.children.indexOf(newModule), 1);
  }

  return newModule.exports;
}
