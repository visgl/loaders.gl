// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createElement} from 'react';
import {createRoot} from 'react-dom/client';
import GLTFDemo from './demo';

/** Mount the same glTF viewer used by the website in the standalone example. */
export function runApp(): void {
  const container = document.getElementById('app');
  if (!container) throw new Error('The glTF example requires an app container.');
  createRoot(container).render(createElement(GLTFDemo));
}
