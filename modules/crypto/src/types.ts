// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

export type CryptoHashOptions = {
  modules?: {[moduleName: string]: any};
  crypto?: {
    algorithm;
    onEnd?;
  };
};
