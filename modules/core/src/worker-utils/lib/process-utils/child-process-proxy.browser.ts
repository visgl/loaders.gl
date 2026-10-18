// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ChildProcessProxyProps} from './child-process-proxy';

export default class ChildProcessProxy {
  constructor() {
    throw new Error('ChildProcessProxy is not available in browser environments');
  }

  async start(props?: ChildProcessProxyProps): Promise<object> {
    return await Promise.resolve({});
  }

  async stop(): Promise<void> {
    return await Promise.resolve();
  }

  async exit(): Promise<void> {
    return await Promise.resolve();
  }
}
