// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {asyncDeepMap} from './async-deep-map';

export type LoadOptions = Record<string, any>;
export type Load = (data: ArrayBuffer, options: Record<string, any>) => Promise<any>;

export async function deepLoad(urlTree: unknown, load: Load, options: LoadOptions) {
  return await asyncDeepMap(urlTree, (url: string) => shallowLoad(url, load, options));
}

export async function shallowLoad(url: string, load: Load, options: LoadOptions): Promise<any> {
  const response = await fetch(url, options.fetch);
  const arrayBuffer = await response.arrayBuffer();
  return await load(arrayBuffer, options);
}
