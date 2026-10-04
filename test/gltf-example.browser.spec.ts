// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import React from 'react';
import {createRoot} from 'react-dom/client';
import GLTFDemo from '../examples/website/gltf/demo';

// Exercise selector/loader behavior without creating a GPU device in the fast suite.
vi.mock('@deck.gl/react', () => ({default: () => null}));

// Keep the interactive sample test offline; the bundled choices survive an unavailable gallery.
vi.mock('../examples/website/gltf/components/examples', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  loadModelList: async () => {
    throw new Error('Offline gallery');
  }
}));

test('the glTF example selects and loads both bundled original glTF 1 models with an offline gallery', async () => {
  const container = document.createElement('div');
  container.style.cssText = 'width: 640px; height: 480px';
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    root.render(React.createElement(GLTFDemo));
    await expect
      .poll(() => container.querySelector('[role="status"]')?.textContent, {timeout: 10000})
      .toBe('Converted from glTF 1 to glTF 2: Box (glTF 1).');
    const selector = container.querySelector('select')!;
    expect(Array.from(selector.options, option => option.textContent)).toEqual([
      'Box (glTF 1)',
      'Box Animated (glTF 1)',
      'Damaged Helmet (glTF 2)'
    ]);
    selector.selectedIndex = 1;
    selector.dispatchEvent(new Event('change', {bubbles: true}));
    await expect
      .poll(() => container.querySelector('[role="status"]')?.textContent, {timeout: 10000})
      .toBe('Converted from glTF 1 to glTF 2: Box Animated (glTF 1).');
    expect(container.textContent).toContain('Shader behavior is not converted.');
    expect(container.querySelector('[role="status"]')?.textContent).not.toContain('Unable');
  } finally {
    root.unmount();
    container.remove();
  }
});
