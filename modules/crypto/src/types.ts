// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type CryptoHashOptions = {
  modules?: {[moduleName: string]: any};
  crypto?: {
    algorithm;
    onEnd?;
  };
};
