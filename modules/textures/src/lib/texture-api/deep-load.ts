// loaders.gl, MIT license
import {asyncDeepMap} from './async-deep-map';

export type LoadOptions = {fetch?: typeof fetch | RequestInfo};
export type Load = (data: ArrayBuffer, options: Record<string, any>) => Promise<any>;

export async function deepLoad(urlTree: unknown, load: Load, options: LoadOptions) {
  return await asyncDeepMap(urlTree, (url: string) => shallowLoad(url, load, options));
}

export async function shallowLoad(url: string, load: Load, options: LoadOptions): Promise<any> {
  // console.error('loading', url);
  const fetchFile = typeof options.fetch === 'function' ? options.fetch : fetch;
  const fetchOptions = typeof options.fetch !== 'function' ? options.fetch : {};
  const response = await fetchFile(url, fetchOptions);
  const arrayBuffer = await response.arrayBuffer();
  return await load(arrayBuffer, options);
}
