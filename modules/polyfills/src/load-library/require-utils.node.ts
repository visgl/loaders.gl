// SPDX-License-Identifier: MIT

// Fork of https://github.com/floatdrop/require-from-string/blob/master/index.js
// Copyright (c) Vsevolod Strukchinsky <floatdrop@gmail.com> (github.com/floatdrop)
// MIT license

// this file is not visible to webpack (it is excluded in the package.json "browser" field).

import Module from 'module';
import path from 'path';
import fs from 'fs';
import {fileURLToPath} from 'node:url';
import {ensureArrayBuffer} from '@loaders.gl/core/loader-utils';

/**
 * Loads exact file bytes from a local path, file URL or HTTP(S) resource.
 * Typed-array byte ranges are preserved rather than exposing a pooled Node backing buffer.
 * @param filename - Resource location; relative file paths resolve against the working directory.
 */
export async function readFileAsArrayBuffer(filename: string): Promise<ArrayBuffer> {
  if (filename.startsWith('http')) {
    const response = await fetch(filename);
    return await response.arrayBuffer();
  }
  return ensureArrayBuffer(fs.readFileSync(resolveFilePath(filename)));
}

/**
 * Loads UTF-8 text from a local path, file URL or HTTP(S) resource.
 * @param filename - Resource location; relative file paths resolve against the working directory.
 */
export async function readFileAsText(filename: string): Promise<string> {
  if (filename.startsWith('http')) {
    const response = await fetch(filename);
    return await response.text();
  }
  const text = fs.readFileSync(resolveFilePath(filename), 'utf8');
  return text;
}

// Node.js Dynamically require from file
// Relative names are resolved relative to cwd
// This indirect function is provided because webpack will try to bundle `module.require`.
// this file is not visible to webpack (it is excluded in the package.json "browser" field).
/** Loads a CommonJS library, resolving local relative imports against the library file. */
export async function requireFromFile(filename: string): Promise<any> {
  if (filename.startsWith('http')) {
    const response = await fetch(filename);
    const code = await response.text();
    return requireFromString(code);
  }

  const filePath = resolveFilePath(filename);
  const code = fs.readFileSync(filePath, 'utf8');
  return requireFromString(code, filePath);
}

// Dynamically require from string
// - `code` - Required - Type: string - Module code.
// - `filename` - Type: string - Default: '' - Optional filename.
// - `options.appendPaths` Type: Array List of paths, that will be appended to module paths.
// Useful, when you want to be able require modules from these paths.
// - `options.prependPaths` Type: Array Same as appendPaths, but paths will be prepended.
/** Evaluates a CommonJS library with an optional filename/file URL and module search paths. */
export function requireFromString(
  code: string,
  filename = '',
  options?: {
    prependPaths?: string[];
    appendPaths?: string[];
  }
): any {
  if (typeof filename === 'object') {
    options = filename;
    filename = '';
  }
  if (filename.startsWith('file:')) filename = fileURLToPath(filename);

  if (typeof code !== 'string') {
    throw new Error(`code must be a string, not ${typeof code}`);
  }

  // @ts-ignore
  const paths = Module._nodeModulePaths(path.dirname(filename));

  const parent = typeof module !== 'undefined' && module?.parent;

  // @ts-ignore
  const newModule = new Module(filename, parent);
  newModule.filename = filename;
  newModule.paths = ([] as string[])
    .concat(options?.prependPaths || [])
    .concat(paths)
    .concat(options?.appendPaths || []);
  // @ts-ignore
  newModule._compile(code, filename);

  if (parent && parent.children) {
    parent.children.splice(parent.children.indexOf(newModule), 1);
  }

  return newModule.exports;
}

/** Resolves local paths and file URLs without treating URL escapes or drive paths as relative names. */
function resolveFilePath(filename: string): string {
  return filename.startsWith('file:') ? fileURLToPath(filename) : path.resolve(filename);
}
