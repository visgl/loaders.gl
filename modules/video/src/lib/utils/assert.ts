// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

export function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}
